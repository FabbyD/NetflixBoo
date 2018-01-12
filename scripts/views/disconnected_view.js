/******************************************************************************
 * File: disconnected_view.js
 * Desc: View when a user signs in
 * Author: Fabrice Dugas
 * Date: 10/01/2018
 *****************************************************************************/
 
function DisconnectedView() {
 console.log('Entering DisconnectedView');
 this.createSessionButton = document.getElementsByClassName('create-session-button')[0];
 this.sessionsList = document.getElementsByClassName('sessions-list')[0];
 this.signOutButton = document.getElementsByClassName('sign-in-button')[0];
 this.sessionsContainer = document.getElementsByClassName('sessions-container')[0];
 
 this.sessionsContainer.style.display = 'block';
 this.createSessionButton.style.display = 'block';
 this.createSessionButton.disabled = false;
 this.signOutButton.disabled = false;
 this.signOutButton.onclick = this.signOut.bind(this);
 this.createSessionButton.onclick = this.createSession.bind(this);
 this.loadSessions();
}
 
DisconnectedView.prototype.loadSessions = function() {
  // Display create session button
  this.createSessionButton.style.display = 'block';
  
  // Loads the last 5 sessions and listens for new ones.
  FirebaseSession.loadLast(5, function(session) {
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
    var joinButton = div.querySelector('.session-button');
    
    // Listen to join button
    joinButton.addEventListener('click', function(e) {
      this.session = session;
      var options = {
        type: requester.JOIN_SESSION,
        data: session.key,
        async: true
      };
      requester.request(options, this.joinedSession.bind(this));
    }.bind(this));
  }.bind(this)); 
}

DisconnectedView.prototype.createSession = function() {
  this.createSessionButton.disabled = true;
  var options = {
    type: requester.CREATE_SESSION,
    async: true
  };
  requester.request(options, this.joinedSession.bind(this));
}

DisconnectedView.prototype.joinedSession = function(session) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
  }
  if (session) {
    this.clean();
    var state = new ConnectedView(session);
  }
}

DisconnectedView.prototype.signOut = function() {
  this.clean();
  credentials.signOut();
  var state = new SignInView();
}

DisconnectedView.prototype.clean = function() {
  // unload all sessions
  this.createSessionButton.style.display = 'none';
  while(this.sessionsList.lastChild) {
    this.sessionsList.removeChild(this.sessionsList.lastChild);
  }
  FirebaseSession.stopListening();
}