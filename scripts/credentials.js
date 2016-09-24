
// Initialize Firebase
var config = {
  apiKey: "AIzaSyDVt3hs8xgCxZRnIVahX8zvg5rjb2IF-Z4",
  authDomain: "netflix-boo.firebaseapp.com",
  databaseURL: "https://netflix-boo.firebaseio.com",
  storageBucket: "netflix-boo.appspot.com",
  messagingSenderId: "561430015544"
};
firebase.initializeApp(config);

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var head = document.getElementsByTagName('h3')[0];
      head.style.backgroundImage = "url('../images/pacman64.png')";
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      
      document.getElementById('sign-in-button').textContent = 'Sign out';
      document.getElementById('sign-in-status').textContent = 'Signed in';
    } else {
      // Let's try to get a Google auth token programmatically.
      document.getElementById('sign-in-button').textContent = 'Sign-in with Google';
      document.getElementById('sign-in-status').textContent = 'Signed out';
    }
    
    document.getElementById('sign-in-button').disabled = !isActivated;
  });
  
  // Check if extension was activated by user before activating activate-button
  isActivated(
    function(isActivated) {
      document.getElementById('activate-button').disabled = isActivated;
    });
      
  document.getElementById('sign-in-button').addEventListener('click', startSignIn, false);
  document.getElementById('activate-button').addEventListener('click', injectScript, false);
}

// Asks background.js if the extension was activated by user
function isActivated(callback) {
  chrome.runtime.sendMessage({greeting : 'isActivated'}, callback);
}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
  // Request an OAuth token from the Chrome Identity API.
  chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
    // Change head image when trying to sign in
    var head = document.getElementsByTagName('h3')[0];
    head.style.backgroundImage = "url('../images/pacman64-loading.gif')";
    
    if (chrome.runtime.lastError && !interactive) {
      console.log('It was not possible to get a token programmatically.');
    } else if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      // Authorize Firebase with the OAuth Access Token.
      var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      firebase.auth().signInWithCredential(credential).catch(function(error) {
        // The OAuth token might have been invalidated. Lets' remove it from cache.
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            startAuth(interactive);
          });
        }
      });
    } else {
      console.error('The OAuth Token was null');
    }
    
  });
}

/**
 * Starts the sign-in process.
 */
function startSignIn() {
  document.getElementById('sign-in-button').disabled = true;
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    startAuth(true);
  }
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
  initApp();
};