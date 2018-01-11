/******************************************************************************
 * File: signin_view.js
 * Desc: View when a user signs in
 * Author: Fabrice Dugas
 * Date: 10/01/2018
 *****************************************************************************/

function SignInView() {
  console.log('Entering SignInView');
  this.logo = document.getElementById('logo');
  this.signInButton = document.getElementsByClassName('sign-in-button')[0];
  this.signInButton.style.display = "inline";
  this.signInButton.disabled = false;
  
  this.ORIGINAL_IMG_URL = 'url("../../images/logo.png")';
  this.LOADING_IMG_URL = 'url("../../images/pacman64-loading.gif")';
  
  if (credentials.isSignedIn()) {
    this.nextState();
  } else {
    credentials.setOnAuthStateChanged(this.onAuthStateChanged.bind(this));
  }
  
  this.signInButton.addEventListener('click', this.startSignIn.bind(this));
}

SignInView.prototype.startSignIn = function() {
  this.signInButton.disabled = true;
  this.logo.src = this.LOADING_IMG_URL;
  credentials.startAuth(true);
}

SignInView.prototype.onAuthStateChanged = function(user) {
  // Restore original image
  this.logo.src = this.ORIGINAL_IMG_URL;
  
  if (user) {
    // User is signed in
    this.nextState();
  } else {
    // User is signed out
    console.error('The app is in an invalid state.')
  }
}

SignInView.prototype.clean = function() { 
}

SignInView.prototype.nextState = function() {
  this.clean();
  requester.request(requester.GET_SESSION, function(session) {
    if (session) {
      var state = new ConnectedView(session);
    } else {
      var state = new DisconnectedView();
    }
  }.bind(this));
}
