/******************************************************************************
 * File: credentials.js
 * Desc: Handles signing in to Firebase using a Google account
 * Author: Fabrice Dugas
 *****************************************************************************/

/**
 * Credentials constructor
 */
function Credentials(){
  // DOM shortcuts
  this.head = document.getElementsByTagName('h3')[0];
  this.sessionsList = document.getElementsByClassName('sessions-container')[0];
  this.activateButton = document.getElementById('activate-button');
  this.signInButton = document.getElementById('sign-in-button');
  this.signInStatus = document.getElementById('sign-in-status');
  
  this.initFirebase()
  
  // Check if extension was already activated by user
  isActivated(
    function(isActivated) {
      this.activateButton.disabled = isActivated;
    }.bind(this));
    
  this.signInButton.addEventListener('click', this.startSignIn.bind(this), false);
  this.activateButton.addEventListener('click', injectScript, false);
}

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

Credentials.ORIGINAL_IM_URL = 'url("../images/pacman64.png")'
Credentials.LOADING_IMG_URL = 'url("../images/pacman64-loading.gif")'

/**
 * Add handler on authentification state changes
 */
Credentials.prototype.onAuthStateChanged = function(user) {
  // Restore original image
  var headImage = this.head.style.backgroundImage;
  if (headImage == Credentials.LOADING_IMG_URL){
    this.head.style.backgroundImage = Credentials.ORIGINAL_IM_URL;
  }
  
  if (user) {
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    
    this.signInButton.textContent = 'Sign out';
    this.signInStatus.textContent = 'Signed in';
    
    // Check if user already joined a session
    getSession(
      function(currKey) {
        console.log(currKey)
        if (!currKey)
          this.loadSessions();
      }.bind(this));
  } else {
    this.signInButton.textContent = 'Sign-in with Google';
    this.signInStatus.textContent = 'Signed out';
    
    this.unloadSessions(); 
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
  // Reference to the /sessions/ database path.
  this.sessionsRef = this.database.ref('sessions');
  
  if (this.sessionsRef) {
    // Make sure we remove all previous listeners.
    this.sessionsRef.off();
    
    // Loads the last 5 sessions and listens for new ones.
    var setSession = function(data) {
      console.log('Set session:');
      console.log(data);
      var val = data.val();
      this.displaySession(data.key, val.owner, val.participants);
    }.bind(this);
    this.sessionsRef.limitToLast(5).on('child_added', setSession); 
  }
  
  else {
    //TODO: There are no sessions in the database
  }
  
  
}

/**
 * Remove sessions from the page
 */
Credentials.prototype.unloadSessions = function() {
  var sessionsList = this.sessionsList;
  while (sessionsList.lastChild) {
    sessionsList.removeChild(sessionsList.lastChild);
  }
}

Credentials.SESSION_TEMPLATE =
    '<div class="session-container">' +
      '<div class="session-owner">Unknown</div>' +
      '<button class="session-join-button">Join</button>' +
    '</div>';

Credentials.SESSION_JOINED_TEMPLATE =
    '<div class="session-joined">' +
      '<label class="session-joined-label">Currently in session with</label>' +
      '<div class="session-joined-owner">Unknown</div>' +
      '<button class="session-leave-button">Leave session</button>' +
    '</div>';
    
/**
 * Add DOM elements for a single session
 * @param{string} key Session key
 * @param{string} owner Session's owner
 * @param{json} participants List of participants?
 */
Credentials.prototype.displaySession = function(key, owner, participants){
  var div = document.getElementById(key);
  // If an element for that session does not exist yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Credentials.SESSION_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.sessionsList.appendChild(div);
  }
  div.querySelector('.session-owner').textContent = owner
  var joinButton = div.querySelector('.session-join-button')
  joinButton.textContent = 'Join ' + owner
  
  // Check if we already joined that session
  getSession(
    function(currKey) {
      joinButton.disabled = (currKey == key);
    });
  
  // Listen to button
  joinButton.addEventListener('click', function(e) {
    e.preventDefault();
    this.joinSession(key, owner);
  }.bind(this));
  
}

/**
 * Join an existing session
 * @param{string} sessionKey Session key
 * @param{string} owner Session's owner
 */
Credentials.prototype.joinSession = function(sessionKey, owner) {
  // TODO: Check if user is already in a session

  this.currentSession = sessionKey;
  var currentUser = this.auth.currentUser;
  
  var sessionRef = this.sessionsRef.child(sessionKey);
  if (sessionRef) {
    console.log(currentUser.displayName + ' is joining ' + owner);
    var participantsRef = sessionRef.child('participants');
    
    var newParticipantRef = participantsRef.push();
    var userKey = newParticipantRef.key;
    
    newParticipantRef.set({
      name: currentUser.displayName
    })
    .then(function() {
      saveKeys(sessionKey, userKey);
      this.unloadSessions();
      var joined = document.createElement('div');
      joined.innerHTML = Credentials.SESSION_JOINED_TEMPLATE;
      joined.querySelector('.session-joined-owner').innerHTML = owner;
    }.bind(this))
    .catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
}

//TODO: leaveSession
Credentials.prototype.leaveSession = function(sessionKey, userKey) {
  
}

//TODO: createSession
Credentials.prototype.createSession = function(sessionKey, userKey) {
  
}

/**
 * Asks background.js if the extension was activated by user
 */
function isActivated(callback) {
  chrome.runtime.sendMessage({greeting : 'isActivated'}, callback);
}

/**
 * Asks background.js for the current session key
 */
function getSession(callback) {
  chrome.runtime.sendMessage({greeting : 'getSession'}, callback);
}

/**
 * Save keys in background.js
 */
function saveKeys(sessionKey, userKey) {
  chrome.runtime.sendMessage({
    greeting : 'saveKeys',
    sessionKey : sessionKey,
    userKey : userKey
    });
}

/**
 * Injects javascript code in the Netflix page
 */
function injectScript() {
  // Check if code was injected already
  chrome.runtime.sendMessage({greeting : 'activate'},
    function(isActivated) {
        if (!isActivated) {
          chrome.tabs.executeScript(null, {file: "./scripts/utilities.js"});
          chrome.tabs.executeScript(null, {file: "./scripts/mouseSimulator.js"});
          chrome.tabs.executeScript(null, {file: "./scripts/VideoController.js"});
          document.getElementById('activate-button').disabled = true;
          document.getElementById('sign-in-button').disabled = false;
        }
    });
}
 
 
window.onload = function() {
  var credentials = new Credentials();
};