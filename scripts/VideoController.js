/******************************************************************************
 * File: VideoController.js
 * Desc: Handles interaction with Netflix video player
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
  this.scrubber.addEventListener('mouseup', this.scrubberHandler.bind(this));
  
  // Listen to Manager
  chrome.runtime.onMessage.addListener(this.messageHandler.bind(this));
}

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
    var state = (paused ? State.PAUSED : State.PLAYING);
    var time = this.video.currentTime;
    
    this.sendMessage(state, time);
  }
}

VideoController.prototype.scrubberHandler = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    var paused = this.video.paused;
    var state = (paused ? State.PAUSED : State.PLAYING);
    var time = this.pos2time(e.clientX);
    
    console.log('Seeked at ' + time);
    
    this.sendMessage(state, time);
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

// Convert a position on the scrubber to a time in seconds
VideoController.prototype.pos2time = function(posX) {
  // Get scrubber dimensions
  var rect = this.scrubber.getBoundingClientRect();
  var offsetLeft = rect.left;
  var width = rect.width;
  var prct = (posX - offsetLeft)/width;
  
  var videoLength = this.video.seekable.end(0);
  var time = prct*videoLength;
  return time;
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
  if (request.state == State.PLAYING) {
    this.seek(request.time);
    this.play();
  }
  
  else if (request.state == State.PAUSED) {
    this.seek(request.time);
    this.pause();
  }
}

VideoController.prototype.sendMessage = function(state, time) {
  chrome.runtime.sendMessage({state : state, time : time});
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
      var state = (paused ? State.PAUSED : State.PLAYING);
      var time = controller.video.currentTime;
      contoller.sendMessage(state, time);
    }
    
    //TODO: Add arrow keys
  };
  
  // Listen to page refresh or exit
  window.addEventListener('unload', function() {
    controller.sendMessage(State.UNLOADED);
  });
  
};

// Initialize the controller when the script is injected
console.log('videoController injected');
initController();