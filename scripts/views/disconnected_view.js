/******************************************************************************
 * File: disconnected_view.js
 * Desc: View when a user signs in
 * Author: Fabrice Dugas
 * Date: 10/01/2018
 *****************************************************************************/
 
function DisconnectedView() {
 console.log('Entering DisconnectedView');
 this.createSessionButton = document.getElementsByClassName('create-session-button')[0];
 this.loadSessions();
}
 
DisconnectedView.prototype.loadSessions = function() {
  // Display create session button
  this.createSessionButton.style.display = 'block';
  
  // Loads the last 5 sessions and listens for new ones.
  FirebaseSession.loadLast(5, function(session) {
    // TODO Display them in the UI
  }); 
 }