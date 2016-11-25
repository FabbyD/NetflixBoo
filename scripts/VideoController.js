/******************************************************************************
 * File: VideoController.js
 * Desc: Handles interaction with Netflix video player
 * Author: Fabrice Dugas
 *****************************************************************************/

function VideoController() {
  // Shortcuts to DOM elements
  this.player = document.getElementsByClassName('NFPlayer')[0];
  this.bigPlayPause = document.getElementsByClassName('nf-big-play-pause')[0];
  this.video = document.getElementsByTagName('video')[0];
  this.scrubberBar = document.getElementsByClassName('scrubber-bar')[0];
  this.scrubberHead = document.getElementsByClassName('scrubber-head')[0];
  this.playButton = document.getElementsByClassName('button-nfplayerPause')[0];
  
  // Try with other version maybe
  if (!this.playButton){
    this.playButton = document.getElementsByClassName('button-nfplayerPlay')[0];
  }
  
  // Play/Pause
  this.playButton.addEventListener('click', this.playPauseButtonHandler.bind(this));
  this.bigPlayPause.addEventListener('click', this.bigPlayPauseHandler.bind(this));
  
  // Video seeking
  // TODO: Listen better... Only works when mouse is on the bar now
  this.scrubberBar.addEventListener('mouseup', this.seekListener.bind(this));
  
  // Listen to Manager
  chrome.runtime.onMessage.addListener(this.messageHandler.bind(this));
}

VideoController.prototype.showControls = function() {
  var move = createFakeMouseEvent("mousemove", 0, 0);
  this.player.dispatchEvent(move)
}

VideoController.prototype.hideControls = function() {
  var move = createFakeMouseEvent("mousemove", 0, 0);
  this.player.dispatchEvent(move);
}

VideoController.prototype.play = function() {
  var paused = this.video.paused;
  console.log('Paused: ' + paused)
  if (paused){
    console.log('Play')
    var click = createFakeMouseEvent("click", 0, 0);
    this.playButton.dispatchEvent(click)
  }
}

VideoController.prototype.pause = function() {
  var paused = this.video.paused;
  console.log('Paused: ' + paused)
  if (!paused){
    console.log('Pause')
    var click = createFakeMouseEvent("click", 0, 0);
    this.playButton.dispatchEvent(click)
  }
}

VideoController.prototype.playPauseButtonHandler = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    var paused = this.video.paused;
    var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
    var time = this.video.currentTime;
    
    this.sendMessage(state, time);
  }
}

VideoController.prototype.bigPlayPauseHandler = function(e) {
  // This listener seems to be fired before the video is actually affected so
  // the video state must be reversed
  if (!e.fake) {
    var paused = !this.video.paused;
    var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
    var time = this.video.currentTime;
    
    this.sendMessage(state, time);
  }
}

VideoController.prototype.seekListener = function(e) {
  // Verify that it is not a simulated click
  if (!e.fake) {
    // TODO: Find out why video is always considered paused
    // even when playing. Consider using the play/pause button as
    // indicator instead?
    var paused = this.video.paused;
    var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
    var time = this.pos2time(e.clientX);
    
    console.log('Seeked at ' + time);
    
    this.sendMessage(state, time);
  }
}

// Convert time in seconds to a position on the scrubberBar
VideoController.prototype.time2pos = function(time) {
  var rect = this.scrubberBar.getBoundingClientRect();
  var videoLength = this.video.seekable.end(0);
  var pos = rect.left + time/videoLength*rect.width;
  
  // Limit to scrubberBar dimensions
  pos = pos >= rect.right ? rect.right : pos
  pos = pos <= rect.left  ? rect.left  : pos
  
  return pos;
}

// Convert a position on the scrubberBar to a time in seconds
VideoController.prototype.pos2time = function(posX) {
  var rect = this.scrubberBar.getBoundingClientRect();
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
    var scrubberHead = this.scrubberHead;
    var rect = scrubberHead.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    
    // Calculate position to seek to
    var posX = this.time2pos(time);
    var posY = centerY;
    
    // Grab scrubberHead...
    var grab = createFakeMouseEvent("mousedown", centerX, centerY);
    scrubberHead.dispatchEvent(grab);
    
    // ... drag to seek position...
    var drag = createFakeMouseEvent("mousemove", posX, posY);
    scrubberHead.dispatchEvent(drag);
    
    // ... and finally drop
    var drop = createFakeMouseEvent("mouseup", posX, posY);
    scrubberHead.dispatchEvent(drop);
    
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
  
  console.log(request);
  console.log(utils.state.PLAYING);
  
  if (request.state == utils.state.PLAYING) {
    console.log('request to play')
    this.play()
  }else if (request.state == utils.state.PAUSED) {
    console.log('request to pause')
    this.pause()
  }
}

VideoController.prototype.sendMessage = function(state, time) {
  console.log('Trying to send: ' + state + ' ' + time)
  chrome.runtime.sendMessage({state : state, time : time});
}

VideoController.prototype.test = function() {
  console.log('Starting set of tests!')
  
  setTimeout(function(){
    console.log('Showing controls')
    this.showControls()
    
    setTimeout(function(){
      console.log('Hiding controls')
      this.hideControls()
    }.bind(this), 2000)
  }.bind(this),10000)
  
}

function initController(){
  var controller;
  var id = setInterval(function() {
    var controls = document.getElementsByClassName('main-controls')[0];
    if (controls) {
      console.log('Netflix controls are ready');
      clearInterval(id);
      
      controller = new VideoController();
      // Make sure video really loaded
      setTimeout(function() {
        controller.pause();
      }, 100)
    }
  }, 100);
  
  // Listen to key down (keypress doesn't react to space)
  document.addEventListener('keydown', function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    
    if (key == ' '.charCodeAt()) {
      console.log('space pressed');
      var paused = controller.video.paused;
      var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
      var time = controller.video.currentTime;
      controller.sendMessage(state, time);
    }
    
    else if (key == 'A'.charCodeAt()) {
      console.log('\'a\' pressed');
      setTimeout(function() {
        console.log('5 secs passed');
        controller.seek(600);
      }, 5000);
    }
    
    else if (key == 'B'.charCodeAt()) {
      console.log('\'b\' pressed');
      setTimeout(function() {
        console.log('5 secs passed');
        controller.play();
      }, 5000);
    }
    
    else if (key == 'C'.charCodeAt()) {
      console.log('\'c\' pressed');
      setTimeout(function() {
        console.log('5 secs passed');
        controller.pause();
      }, 5000);
    }
    
    else if (key == 'D'.charCodeAt()) {
      console.log('\'d\' pressed');
      setTimeout(function() {
        console.log('5 secs passed');
        controller.showControls();
      }, 5000);
    }
    
    else if (key == 'E'.charCodeAt()) {
      console.log('\'e\' pressed');
      setTimeout(function() {
        console.log('5 secs passed');
        controller.hideControls();
      }, 5000);
    }
    
  });
  
  // Listen to page refresh or exit
  window.addEventListener('unload', function() {
    controller.sendMessage(utils.state.UNLOADED);
  });
  
  
  console.log('videoController injected');
  
};

// Initialize the controller when the script is injected
initController();