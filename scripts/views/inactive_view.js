/******************************************************************************
 * File: inactive_popup.js
 * Desc: View when the extension is not activated
 * Author: Fabrice Dugas
 * Date: 09/01/2018
 *****************************************************************************/

function InactiveView() {
  console.log('Entering InactiveView');
  this.logo = document.getElementById('logo');
  this.activateButton = document.getElementsByClassName('activate-button')[0];
  
  // Check if extension was already activated by user
  requester.request(requester.IS_ACTIVATED, function(isActivated) {
    this.activateButton.disabled = isActivated;
    if (isActivated) {
      this.nextState();
    } else {
      this.activateButton.addEventListener('click', this.activate.bind(this), false);
    }
  }.bind(this));
}

InactiveView.prototype.activate = function() {
  // FIXME Hackish way to use the same controller for 2 versions
  var controllerFiles = ['netflix_controller.js', 'youtube_controller.js', 'youtube_controller.js'];
  requester.request(requester.ACTIVATE, function() {
    var controllerFile = controllerFiles[version];
    chrome.tabs.executeScript(null, {file: "./scripts/utilities.js"});
    chrome.tabs.executeScript(null, {file: "./scripts/mouse_simulator.js"});
    chrome.tabs.executeScript(null, {file: "./scripts/" + controllerFile});
    this.nextState();
  }.bind(this));
}

InactiveView.prototype.clean = function() {
  this.activateButton.style.display = 'none';
}

InactiveView.prototype.nextState = function() {
  this.clean();
  if (credentials.isSignedIn()) {
    var newState = new DisconnectedView();
  } else {
    var newState = new SignInView();
  }
}
