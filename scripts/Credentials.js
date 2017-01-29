/******************************************************************************
 * File: credentials.js
 * Desc: Handles signing in to Firebase using a Google account
 * Author: Fabrice Dugas
 *****************************************************************************/

// TODO: Improve this spaghetti mess !! :S
 
/**
 * Credentials constructor
 */
function Credentials(){
  // DOM shortcuts
  this.head = document.getElementsByTagName('h3')[0];
  this.mainContainer = document.getElementsByClassName('main-container')[0];
  this.sessionsList = document.getElementsByClassName('sessions-container')[0];
  this.activateButton = document.getElementsByClassName('activate-button')[0];
  this.signInButton = document.getElementsByClassName('sign-in-button')[0];
  this.userName = document.getElementsByClassName('user-name')[0];
  this.createSessionButton = document.getElementsByClassName('create-session-button')[0];
  
  this.isActive = false;
  this.isSignedIn = false;
  this.currSession = null;
  
  this.initFirebase();
  this.initUI();
}

Credentials.SESSION_TEMPLATE =
  '<div class="row vertical-align ">' +
    '<div class="col-xs-4">' +
      '<div class="owner-picture-container">' +
        '<img class="owner-picture" src="../images/pacman64.png" alt="Owner\'s picture">' +
      '</div>' +
    '</div>' +
    '<div class="col-xs-4">' +
      '<div class="owner-name-container text-center">' +
        'Whitney' +
      '</div>' +
    '</div>' +
    '<div class="col-xs-4">' +
      '<button type="button" class="btn btn-warning session-button">Button</button>' +
    '</div>' +
  '</div>'

Credentials.CREATE_SESSION_BUTTON_ID = 'create-session-button'
    
Credentials.ORIGINAL_IMG_URL = 'url("../images/logo.png")'
Credentials.LOADING_IMG_URL = 'url("../images/pacman64-loading.gif")'

/**
 * Sets up shortcuts to Firebase features and initiate firebase auth.
 * Stole from github.com/friendlychat
 */
Credentials.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

/**
 * Sets up the user interface.
 */
Credentials.prototype.initUI = function() {
  // Check if user is in session (do this before checking activation)
  getSession(function(session) {
    if (session) {
      this.session = session;
      this.displayCurrentSession(session);
    }
  }.bind(this));
  
  // Check if extension was already activated by user
  isActivated(function(isActivated){
    this.isActive = isActivated;
    if (isActivated) {
      this.activated();
    }
  }.bind(this));
    
  // Add listeners
  this.signInButton.addEventListener('click', this.startSignIn.bind(this), false);
  this.activateButton.addEventListener('click', this.activate.bind(this), false);
  this.createSessionButton.addEventListener('click', this.newSession.bind(this))
 }

/**
 * Add handler on authentification state changes
 */
Credentials.prototype.onAuthStateChanged = function(user) {
  // Restore original image
  var headImage = this.head.style.backgroundImage;
  if (headImage == Credentials.LOADING_IMG_URL){
    this.head.style.backgroundImage = Credentials.ORIGINAL_IMG_URL;
  }
  
  if (user) {
    // User is signed in.
    this.isSignedIn = true;
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    
    this.signInButton.textContent = 'Sign out';
    this.userName.textContent = displayName;
    
    // Check if user already joined a session
    var loadSessions = function(session) {
      if (!session && this.isActive) {
        this.loadSessions();
      }
    }
    getSession(loadSessions.bind(this));
    
  } else {
    // User is signed out
    this.isSignedIn = false;
    this.signInButton.textContent = 'Sign in';
    this.userName.textContent = '';
  }
  
  this.signInButton.disabled = false;
}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
Credentials.prototype.startAuth = function(interactive) {
  // Request an OAuth token from the Chrome Identity API.
  chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {  
    if (chrome.runtime.lastError && !interactive) {
      console.log('It was not possible to get a token programmatically.');
    } else if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      // Authorize Firebase with the OAuth Access Token.
      var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      this.auth.signInWithCredential(credential).catch(function(error) {
        // The OAuth token might have been invalidated. Lets' remove it from cache.
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            this.startAuth(interactive);
          }.bind(this));
        }
      }.bind(this));
    } else {
      console.error('The OAuth Token was null');
    }
    
  }.bind(this));
}

/**
 * Starts the sign-in process.
 */
Credentials.prototype.startSignIn = function() {
  this.signInButton.disabled = true;
  if (this.auth.currentUser) {
    this.leaveSession(false);
    this.unloadSessions();
    this.auth.signOut();
  } else {
    // Change head image when trying to sign in
    this.head.style.backgroundImage = Credentials.LOADING_IMG_URL;
    this.startAuth(true);
  }
}

/**
 * Load sessions on the page and listens to new ones
 */
Credentials.prototype.loadSessions = function() {
  console.log('load sessions')
  // Display create session button
  this.createSessionButton.style.display = 'inline';
  
  // Reference to the /sessions/ database path.
  this.sessionsRef = this.database.ref('sessions');

  // Make sure we remove all previous listeners.
  this.sessionsRef.off();
  
  // Loads the last 5 sessions and listens for new ones.
  var setSession = function(data) {
    var val = data.val();
    this.displaySession(data.key, val.owner, val.participants);
  }.bind(this);
  this.sessionsRef.limitToLast(5).on('child_added', setSession); 
  
}

/**
 * Remove sessions from the page
 */
Credentials.prototype.unloadSessions = function() {
  this.createSessionButton.style.display = 'none';
  var sessionsList = this.sessionsList;
  while (sessionsList.lastChild) {
    sessionsList.removeChild(sessionsList.lastChild);
  }
}
    
/**
 * Add DOM elements for a single session
 * @param{string} key Session key
 * @param{string} owner Session's owner
 */
Credentials.prototype.displaySession = function(key, owner){
  var div = document.getElementById(key);
  // If an element for that session does not exist yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Credentials.SESSION_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.sessionsList.appendChild(div);
  }
  div.querySelector('.owner-name-container').textContent = owner;
  var joinButton = div.querySelector('.session-button');
  joinButton.className += ' session-join-button';
  joinButton.textContent = 'Join';
  
  // Listen to button
  joinButton.addEventListener('click', function(e) {
    e.preventDefault();
    this.joinSession(key, owner);
  }.bind(this));
  
}

/**
 * Add DOM elements for the current session
 * @param{arr} session Array containing session's key and owner
 */
Credentials.prototype.displayCurrentSession = function(session) {
  if (session) {
    this.createSessionButton.style.display = 'none';
    
    var div = document.getElementById(session.key);
    // If an element for that session does not exist yet we create it.
    if (!div) {
      var container = document.createElement('div');
      container.innerHTML = Credentials.SESSION_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', session.key);
      this.sessionsList.appendChild(div);
    }
    
    div.querySelector('.owner-name-container').textContent = session.owner;
    var leaveButton = div.querySelector('.session-button');
    leaveButton.className += ' session-leave-button'
    leaveButton.textContent = 'Leave';
    
    // Listen to button
    leaveButton.addEventListener('click', function(e) {
      e.preventDefault();
      leaveButton.disabled = true;
      this.leaveSession(true);
    }.bind(this));
  }  
}

/**
 * Create a new session
 */
Credentials.prototype.newSession = function() {
  var request = {
    greeting : utils.popup.requests.CREATE_SESSION
  };
  
  var onSuccess = function(session) {
    this.sessionsRef.off();
    this.unloadSessions();
    this.displayCurrentSession(session);
    this.createSessionButton.style.display='none';
  }.bind(this);
  
  chrome.runtime.sendMessage(request, onSuccess);
}

/**
 * Join an existing session
 *
 * @param{string} sessionKey Session key
 */
Credentials.prototype.joinSession = function(sessionKey, owner) {
  var request = {
    greeting   : utils.popup.requests.JOIN_SESSION,
    sessionKey : sessionKey,
    owner      : owner
  };
  
  var onSuccess = function(session) {
    this.unloadSessions();
    this.displayCurrentSession(session);
    this.createSessionButton.style.display='none';
  }.bind(this)
  
  chrome.runtime.sendMessage(request, onSuccess);
}

/**
 * Leave current session
 */
Credentials.prototype.leaveSession = function(reload) {
  var request = {
    greeting : utils.popup.requests.LEAVE_SESSION
  };
  
  var onSuccess = function() {
    this.session = null;
    this.unloadSessions()
    if (reload) {
      this.loadSessions()
    }
  }.bind(this)
  
  chrome.runtime.sendMessage(request, onSuccess);
}

Credentials.prototype.activate = function() {
  // Check if code was injected already
  chrome.runtime.sendMessage({greeting : utils.popup.requests.ACTIVATE},
    function(isActivated) {
        if (!isActivated) {
          chrome.tabs.executeScript(null, {file: "./scripts/utilities.js"});
          chrome.tabs.executeScript(null, {file: "./scripts/mouseSimulator.js"});
          chrome.tabs.executeScript(null, {file: "./scripts/VideoController.js"});
          this.activated();
        }
    }.bind(this));
}

Credentials.prototype.activated = function () {
  this.activateButton.style.display = 'none';
  this.signInButton.style.display = "inline";
  this.userName.style.display = "inline";
  this.unloadSessions() // Just in case
  if (this.session != null) {
    console.log('Displaying current session (activated)');
    this.displayCurrentSession(this.session);
  } else if (this.isSignedIn) {
    console.log('Loading all sessions (activated)');
    this.loadSessions();
  }
}

/**
 * Asks background.js if the extension was activated by user
 */
function isActivated(callback) {
  chrome.runtime.sendMessage({greeting : utils.popup.requests.IS_ACTIVATED}, callback);
}

/**
 * Asks background.js for the current session key
 */
function getSession(callback) {
  chrome.runtime.sendMessage({greeting : utils.popup.requests.GET_SESSION}, callback);
}
 
window.onload = function() {
  var credentials = new Credentials();
};