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
  this.signInButton.textContent = 'Sign in';
  
  this.ORIGINAL_IMG_URL = "../images/logo.png";
  this.LOADING_IMG_URL = "../images/pacman64-loading.gif";
  
  credentials.setOnAuthStateChanged(this.onAuthStateChanged.bind(this));
  this.signInButton.onclick = this.startSignIn.bind(this);
}

SignInView.prototype.startSignIn = function() {
  this.signInButton.disabled = true;
  this.logo.src = this.LOADING_IMG_URL;
  credentials.startAuth(true);
}

SignInView.prototype.onAuthStateChanged = function(user) {
  this.logo.src = this.ORIGINAL_IMG_URL;
  if (user) {
    // User is signed in
    this.signInButton.textContent = 'Sign out';
    this.nextState();
  }
}

SignInView.prototype.clean = function() {
  credentials.setOnAuthStateChanged(null); // stop listening
}

SignInView.prototype.nextState = function() {
  console.log('SignInView.nextState');
  this.clean();
  requester.request({type: requester.GET_SESSION}, function(session) {
    if (session) {
      var state = new ConnectedView(session);
    } else {
      var state = new DisconnectedView();
    }
  }.bind(this));
}
