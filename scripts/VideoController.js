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
    var click = createFakeMouseEvent('click', 0, 0, 0, 0);
    this.playButton.dispatchEvent(click);
  }
}

VideoController.prototype.pause = function() {
  var paused = this.video.paused;
  if (!paused){
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
  
  // Make scrubber appear
  var move = createFakeMouseEvent("mousemove", 50, 50, 50, 50)
  window.dispatchEvent(move)
  
  // Wait for UI to respond
  setTimeout(function() {
    var handle = this.handle;
    var rect = handle.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    
    // Calculate position to seek to
    var posX = this.time2pos(time);
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
  
  var currentTime = this.video.currentTime
  if (currentTime < request.time - 1 || currentTime > request.time + 1) { 
    this.seek(request.time)
  }
  
  if (request.state == State.PLAYING) {
    this.play()
  }
  
  else if (request.state == State.PAUSED) {
    this.pause()
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
      controller.sendMessage(state, time);
    }
    
    // a
    if (key == 65) {
      var begin = controller.video.seekable.start(0)
      var end = controller.video.seekable.end(0)
      
      var rect = controller.scrubber.getBoundingClientRect()
      
      console.log('Time at begin: ' + begin)
      console.log('Left: ' + rect.left)
      
      controller.seek(begin)
      
      setTimeout(function() {
        var rect = controller.handle.getBoundingClientRect()
        var posHandle = rect.left + rect.width/2
        console.log('Current time after seek: ' + controller.video.currentTime)
        console.log('Position of handle: ' + posHandle)
      },4000)
    }
    
    // b
    if (key == 66) {
      var begin = controller.video.seekable.start(0)
      var end = controller.video.seekable.end(0)
      
      var rect = controller.scrubber.getBoundingClientRect()
      
      console.log('Time at end: ' + end)
      console.log('Right: ' + rect.width)
      
      controller.seek(end)
      
      setTimeout(function() {
        var rect = controller.handle.getBoundingClientRect()
        var posHandle = rect.left + rect.width/2
        console.log('Current time after seek: ' + controller.video.currentTime)
        console.log('Position of handle: ' + posHandle)
      },4000)

    }
    
    // c
    if (key == 67) {
      var begin = controller.video.seekable.start(0)
      var end = controller.video.seekable.end(0)
      
      var rect = controller.scrubber.getBoundingClientRect()
      var center = rect.left + rect.width/2
      console.log('Half way: ' + center)
      
      controller.seek(end/2)
      
      setTimeout(function() {
        var rect = controller.handle.getBoundingClientRect()
        var posHandle = rect.left + rect.width/2
        console.log('Current time after seek: ' + controller.video.currentTime)
        console.log('Position of handle: ' + posHandle)
      },2000)

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