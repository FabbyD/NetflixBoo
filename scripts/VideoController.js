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
  
  // Possible user interactions
  this.playPause = 'PlayPause'
  this.seeked = 'Seeked'
  
  /// Listen to user actions
  // Play button
  this.playButton.addEventListener('click', function(e) {
    // Verify that it is not a simulated click
    if (!e.fake) {
      var action = this.playPause;
      var info = {
        paused : this.video.paused,
        currentTime : this.video.currentTime
      };
      
      this.sendMessage(action, info);
    }
  }.bind(this));
  
  // Video seeking
  this.scrubber.addEventListener('click', function(e) {
    console.log(e.fake ? 'Fake scrubber click' : 'Scrubber click');
  }.bind(this));
}

VideoController.prototype.sendMessage = function(action, info) {
  chrome.runtime.sendMessage({action : action, info : info});
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
  // Get position of handle's center
	var handle = this.handle
  var rect = handle.getBoundingClientRect()
  var centerX = rect.left + Math.round(rect.width / 2)
  var centerY = rect.top + Math.round(rect.height / 2);
  
	// Calculate position to seek to
	var posX = this.time2pos(time);
	var posY = centerY;

  // Grab handle...
  var handle = document.getElementsByClassName('player-scrubber-handle')[0];
  var grab = createFakeMouseEvent("mousedown", centerX, centerY, centerX, centerY);
  handle.dispatchEvent(grab);
  
  // ... drag to seek position...
  var drag = createFakeMouseEvent("mousemove", posX, posY, posX, posY);
  handle.dispatchEvent(drag);
  
  // ... and finally drop
  var drop = createFakeMouseEvent("mouseup", posX, posY, posX, posY);
  handle.dispatchEvent(drop);
  
}

function initController(){
  var controller = new VideoController();
  controller.pause();
  console.log('video paused');
  
    // Listen to key presses
  window.onkeydown = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    console.log(key);
    
    // Space bar
    if (key == 32) {
      var paused = controller.video.paused;
      var currTime = controller.video.currTime;
      controller.sendMessage(controller.playPause, {paused : paused, currTime : currTime}, 'Play/Pause');
    }

    // a
    else if (key == 65) {
      controller.seek(120);
    }
  };
  
};

// Initialize the controller when the script is injected
console.log('videoController injected');
initController();