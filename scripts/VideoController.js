/******************************************************************************
 * File: VideoController.js
 * Desc: Handles interaction with Netflix video player
 * Author: Fabrice Dugas
 *****************************************************************************/

function VideoController() {
  // Shortcuts to DOM elements
  this.player = document.getElementById('netflix-player');
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

VideoController.prototype.showControls = function() {
  // I don't think getting the actual position of the scrubber is necessary but whatever
  var rect = this.scrubber.getBoundingClientRect()
  var x = rect.left + rect.width/2
  var y = rect.top + rect.height/2
  var move = createFakeMouseEvent("mousemove", x, y);
  this.scrubber.dispatchEvent(move)
}

VideoController.prototype.hideControls = function() {
  var move = createFakeMouseEvent("mousemove", 0, 0);
  this.player.dispatchEvent(move);
}

VideoController.prototype.play = function() {
  var paused = this.video.paused;
  if (paused){
    var click = createFakeMouseEvent('click', 0, 0);
    this.playButton.dispatchEvent(click);
  }
}

VideoController.prototype.pause = function() {
  var paused = this.video.paused;
  if (!paused){
    var click = createFakeMouseEvent('click', 0, 0);
    this.playButton.dispatchEvent(click);
  }
}

VideoController.prototype.playButtonHandler = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    var paused = this.video.paused;
    var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
    var time = this.video.currentTime;
    
    this.sendMessage(state, time);
  }
}

VideoController.prototype.scrubberHandler = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    var paused = this.video.paused;
    var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
    var time = this.pos2time(e.clientX);
    
    console.log('Seeked at ' + time);
    
    this.sendMessage(state, time);
  }
}

// Convert time in seconds to a position on the scrubber
VideoController.prototype.time2pos = function(time) {
  var rect = this.scrubber.getBoundingClientRect();
  var videoLength = this.video.seekable.end(0);
  var pos = rect.left + time/videoLength*rect.width;
  
  // Limit to scrubber dimensions
  pos = pos >= rect.right ? rect.right : pos
  pos = pos <= rect.left  ? rect.left  : pos
  
  return pos;
}

// Convert a position on the scrubber to a time in seconds
VideoController.prototype.pos2time = function(posX) {
  var rect = this.scrubber.getBoundingClientRect();
  var offsetLeft = rect.left;
  var width = rect.width;
  var prct = (posX - offsetLeft)/width;
  var videoLength = this.video.seekable.end(0);
  var time = prct*videoLength;
  return time;
}

VideoController.prototype.seek = function(time) {
  console.log('Seeking to ' + time)
  
  this.showControls();
  
  setTimeout(function() {
    var handle = this.handle;
    var rect = handle.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    
    // Calculate position to seek to
    var posX = this.time2pos(time);
    var posY = centerY;
    
    // Grab handle...
    var grab = createFakeMouseEvent("mousedown", centerX, centerY);
    handle.dispatchEvent(grab);
    
    // ... drag to seek position...
    var drag = createFakeMouseEvent("mousemove", posX, posY);
    handle.dispatchEvent(drag);
    
    // ... and finally drop
    var drop = createFakeMouseEvent("mouseup", posX, posY);
    handle.dispatchEvent(drop);
    
    setTimeout(function() {
      this.hideControls();
    }.bind(this), 10);
  }.bind(this),10);
}

VideoController.prototype.messageHandler = function(request, sender, sendResponse) {
  var currentTime = this.video.currentTime
  if (currentTime < request.time - 0.5 || currentTime > request.time + 0.5) { 
    this.seek(request.time)
  }
  
  if (request.state == utils.state.PLAYING) {
    this.play()
  } else if (request.state == utils.state.PAUSED) {
    this.pause()
  }
}

VideoController.prototype.sendMessage = function(state, time) {
  chrome.runtime.sendMessage({state : state, time : time});
}

function initController(){
  var controller;
  var id = setInterval(function() {
    var controls = document.getElementsByClassName('player-control-bar')[0];
    if (controls) {
      console.log('Netflix controls are ready');
      controller = new VideoController();
      controller.pause();
      clearInterval(id);
    }
  }, 100);
  
  // Listen to key presses
  window.onkeydown = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    
    // Space bar
    if (key == ' '.charCodeAt()) {
      var paused = controller.video.paused;
      var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
      var time = controller.video.currentTime;
      controller.sendMessage(state, time);
    }
    
    if (key == 'A'.charCodeAt()) {
      console.log('\'a\' pressed');
      setTimeout(function() {
        console.log('15 secs passed');
        controller.seek(300);
      }, 15000);
    }
    
  };
  
  // Listen to page refresh or exit
  window.addEventListener('unload', function() {
    controller.sendMessage(utils.state.UNLOADED);
  });
  
};

// Initialize the controller when the script is injected
console.log('videoController injected');
initController();