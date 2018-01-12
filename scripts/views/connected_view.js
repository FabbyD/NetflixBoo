/******************************************************************************
 * File: connected_view.js
 * Desc: View when a user is connected in a session
 * Author: Fabrice Dugas
 * Date: 11/01/2018
 *****************************************************************************/

function ConnectedView(session) {
  console.log('Entering ConnectedView');
  this.session = session;
  this.sessionsList = document.getElementsByClassName('sessions-list')[0];
  this.signOutButton = document.getElementsByClassName('sign-in-button')[0];
  this.signOutButton.disabled = false;
  this.signOutButton.onclick = this.signOut.bind(this);
  this.displaySession(session);
  document.getElementsByClassName('sessions-container')[0].style.display = 'block';

}

ConnectedView.prototype.displaySession = function(session) {
  var div = document.getElementById(session.key);
  // If an element for that session does not exist yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = templates.SESSION;
    div = container.querySelector('.session');
    div.setAttribute('id', session.key);
    this.sessionsList.appendChild(div);
  }
  div.querySelector('.session-owner-name').textContent = session.owner;
  var leaveButton = div.querySelector('.session-button');
  leaveButton.textContent = 'Leave';
  leaveButton.addEventListener('click', function() {
    this.leave(this.left.bind(this));
  }.bind(this));
}

ConnectedView.prototype.leave = function(callback) {
  var options = {
    type: requester.LEAVE_SESSION
  };
  requester.request(options, callback);
}

ConnectedView.prototype.left = function() {
  this.clean();
  var state = new DisconnectedView();
}

ConnectedView.prototype.signOut = function() {
  this.leave();
  this.clean();
  credentials.signOut();
  var state = new SignInView();
}

ConnectedView.prototype.clean = function() {
  while(this.sessionsList.lastChild) {
    this.sessionsList.removeChild(this.sessionsList.lastChild);
  }
}