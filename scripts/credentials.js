/******************************************************************************
 * File: credentials.js
 * Desc: Credentials page
 * Author: Fabrice Dugas
 *****************************************************************************/

/** TODO:
 * Create Session object
 * Add createSession and leaveSession
 * Update UI when stuff...
 */

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDVt3hs8xgCxZRnIVahX8zvg5rjb2IF-Z4",
  authDomain: "netflix-boo.firebaseapp.com",
  databaseURL: "https://netflix-boo.firebaseio.com",
  storageBucket: "netflix-boo.appspot.com",
  messagingSenderId: "561430015544"
};
firebase.initializeApp(config);

function Credentials(){
  // DOM shortcuts
  this.head = document.getElementsByTagName('h3')[0];
  this.sessionsList = document.getElementsByClassName('sessions-container')[0];
  this.activateButton = document.getElementById('activate-button');
  this.signInButton = document.getElementById('sign-in-button');
  this.signInStatus = document.getElementById('sign-in-status');
  
  this.initFirebase()
  
  // Check if extension was activated by user before activating activate-button
  isActivated(
    function(isActivated) {
      this.activateButton.disabled = isActivated;
    }.bind(this));
    
  this.signInButton.addEventListener('click', this.startSignIn.bind(this), false);
  this.activateButton.addEventListener('click', injectScript, false);
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
// Stole from github.com/friendlychat
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
    
    console.log('User signed in. Loading sessions...')
    this.loadSessions();
  } else {
    // Let's try to get a Google auth token programmatically.
    this.signInButton.textContent = 'Sign-in with Google';
    this.signInStatus.textContent = 'Signed out';
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

Credentials.prototype.loadSessions = function() {
  console.log('loadSessions called');
  // Reference to the /sessions/ database path.
  this.sessionsRef = this.database.ref('sessions');
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
  this.sessionsRef.limitToLast(5).on('child_changed', setSession);
  
}

Credentials.SESSION_TEMPLATE =
    '<div class="session-container">' +
      '<div class="session-spacing"></div>' +
      '<div class="session-owner"></div>' +
      '<div class="session-participants"></div>' +
      '<button class="session-join-button"></button>' +
    '</div>';

Credentials.prototype.displaySession = function(key, owner, participants){
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
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

Credentials.prototype.joinSession = function(sessionKey, owner) {
  // TODO: Check if user is already in a session
  
  this.currentSession = sessionKey;
  var currentUser = this.auth.currentUser;
  
  var sessionRef = this.sessionsRef.child(sessionKey);
  if (sessionRef) {
    console.log(currentUser.displayName + ' is joining ' + owner);
    var participantsRef = sessionRef.child('participants');
    
    var newParticipantRef = participantsRef.push();
    var userKey = newParticipantRef.key();
    
    newParticipantRef.set({
      name: currentUser.displayName
    })
    .then(function() {
      var joinButton = document.getElementById(sessionKey).querySelector('#session-join-button')
      joinButton.disabled = true;
      saveKeys(sessionKey, userKey);
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
 * Injects javascript code
 */
function injectScript() {
  // Check if code was injected already
  chrome.runtime.sendMessage({greeting : 'activate'},
    function(isActivated) {
        if (!isActivated) {
          chrome.tabs.executeScript(null, {file: "./js/mouseSimulator.js"});
          chrome.tabs.executeScript(null, {file: "./js/videoController.js"});
          document.getElementById('activate-button').disabled = true;
          document.getElementById('sign-in-button').disabled = false;
        }
    });
}
 
 
window.onload = function() {
  var credentials = new Credentials();
};