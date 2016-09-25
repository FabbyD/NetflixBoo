/******************************************************************************
 * File: netflixboo.js
 * Desc: injects code to control and listen to video player
 * Author: Fabrice Dugas
 *****************************************************************************/

function VideoController() {
  // Shortcuts to DOM elements
  this.video = document.getElementsByTagName('video')[0];
  this.playButton = document.getElementsByClassName("player-control-button player-play-pause")[0];
  this.scrubber = document.getElementById('scrubber-component');
  this.handle = document.getElementsByClassName('player-scrubber-handle')[0];
  
  // Play button
  this.playButton.addEventListener('click', this.playButtonHandler.bind(this));
  
  // Video seeking
  this.scrubber.addEventListener('click', this.scrubberHandler.bind(this));
  
  // Listen to Manager
  chrome.runtime.onMessage.addListener(this.messageHandler.bind(this));
}

// Possible user interactions
VideoController.PLAY = 'play'
VideoController.PAUSE = 'pause'
VideoController.SEEK = 'seek'
VideoController.UNLOAD = 'unload'

VideoController.prototype.play = function() {
  var paused = this.video.paused;
  if (paused){
    // Simulate a click
    var click = createFakeMouseEvent('click', 0, 0, 0, 0);
    this.playButton.dispatchEvent(click);
  }
}

VideoController.prototype.pause = function() {
  var paused = this.video.paused;
  if (!paused){
    // Simulate a click
    var click = createFakeMouseEvent('click', 0, 0, 0, 0);
    this.playButton.dispatchEvent(click);
  }
}

VideoController.prototype.playButtonHandler = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    var paused = this.video.paused;
    var action = (paused ? VideoController.PAUSE : VideoController.PLAY);
    var time = this.video.currentTime;
    
    sendMessage(action, time);
  }
}

VideoController.prototype.scrubberHandler = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    var action = VideoController.SEEK;
    var time = this.video.currentTime;
    
    sendMessage(action, time);
  }
}

// Convert time in seconds to a position on the scrubber
VideoController.prototype.time2pos = function(time) {
  // Get scrubber dimensions
  var rect = this.scrubber.getBoundingClientRect();
  var offsetLeft = rect.left;
  var width = rect.width;

  var videoLength = this.video.seekable.end(0);
  var prct = time/videoLength;
  
  var pos = offsetLeft + Math.round(prct*width);
  return pos;
}

VideoController.prototype.seek = function(time) {
  console.log('Seeking to ' + time);
  
  // Make scrubber appear
  var appear = createFakeMouseEvent("mousemove", 0, 0, 0, 0);
  window.dispatchEvent(appear);
  
  // Wait for UI to respond
  setTimeout(function() {
    // Get position of handle's center
    var handle = this.handle
    var rect = handle.getBoundingClientRect()
    var centerX = rect.left + Math.round(rect.width / 2)
    var centerY = rect.top + Math.round(rect.height / 2);
    
    // Calculate position to seek to
    var posX = this.time2pos(Math.round(time));
    var posY = centerY;
    
    // Grab handle...
    var grab = createFakeMouseEvent("mousedown", centerX, centerY, centerX, centerY);
    handle.dispatchEvent(grab);
    
    // ... drag to seek position...
    var drag = createFakeMouseEvent("mousemove", posX, posY, posX, posY);
    handle.dispatchEvent(drag);
    
    // ... and finally drop
    var drop = createFakeMouseEvent("mouseup", posX, posY, posX, posY);
    handle.dispatchEvent(drop);
  }.bind(this), 10);
}

VideoController.prototype.messageHandler = function(request, sender, sendResponse) {
  if (request.action == VideoController.PLAY) {
    this.seek(request.time);
    this.play();
  }
  
  else if (request.action == VideoController.PAUSE) {
    this.seek(request.time);
    this.pause();
  }
  
  else if (request.action == VideoController.SEEK) {
    this.seek(request.time);
  }
}

function sendMessage(action, time) {
  chrome.runtime.sendMessage({action : action, time : time});
}

function initController(){
  var controller = new VideoController();
  controller.pause();
  
  // Listen to key presses
  window.onkeydown = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    
    // Space bar
    if (key == 32) {
      var paused = controller.video.paused;
      var action = (paused ? VideoController.PAUSE : VideoController.PLAY);
      var time = controller.video.currentTime;
      sendMessage(action, time);
    }
    
    //TODO: Add arrow keys
  };
  
  // Listen to page refresh or exit
  window.addEventListener('unload', function() {
    sendMessage(VideoController.UNLOAD);
  });
  
};

// Initialize the controller when the script is injected
console.log('videoController injected');
initController();