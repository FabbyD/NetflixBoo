var credentials = {
  auth: firebase.auth(),
  
  getCurrentUser : function() {
    return firebase.auth.currentUser;
  },
  
  isSignedIn : function() {
    return !!this.getCurrentUser();
  },
  
  setOnAuthStateChanged : function(callback) {
    this._onAuthStateChanged = callback;
  },
  
  _onAuthStateChanged : null,
  
  onAuthStateChanged : function(user) {
    if (this._onAuthStateChanged) {
      this._onAuthStateChanged(user);
    }
  },
  
  startAuth : function(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {  
      if (chrome.runtime.lastError && !interactive) {
        console.log('It was not possible to get a token programmatically.');
      } else if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else if (token) {
        // Authorize Firebase with the OAuth Access Token.
        var google_credential = firebase.auth.GoogleAuthProvider.credential(null, token);
        this.auth.signInWithCredential(google_credential).catch(function(error) {
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
  },
  
  signOut : function(){
    this.auth.signOut();
  }
}

credentials.auth.onAuthStateChanged(credentials.onAuthStateChanged.bind(credentials));