/******************************************************************************
 * File: YoutubeController.js
 * Desc: Handles interaction with Youtube video player
 * Author: Fabrice Dugas
 *****************************************************************************/

function YoutubeController() {
  // Shortcut to video element
  this.video = document.getElementsByTagName('video')[0];
  
  // Flags for app controls
  this.appPlay = false;
  this.appPause = false;
  this.appSeek = false;
  
  // Listen to video events
  this.video.addEventListener('play', this.playListener.bind(this));
  this.video.addEventListener('pause', this.pauseListener.bind(this));
  this.video.addEventListener('seeked', this.seekedListener.bind(this));
  
  // Listen to Manager
  chrome.runtime.onMessage.addListener(this.messageHandler.bind(this));
}

YoutubeController.prototype.sendVideoState = function() {
  console.log('sending video state to server')
  var paused = this.video.paused;
  var state = (paused ? utils.state.PAUSED : utils.state.PLAYING);
  var time = this.video.currentTime;
  
  chrome.runtime.sendMessage({state : state, time : time});
}

YoutubeController.prototype.playListener = function() {
  if (this.appPlay) {
    console.log('play caused by APP');
    this.appPlay = false; // Reset the flag
  } else {
    this.sendVideoState()
  }
}

YoutubeController.prototype.pauseListener = function() {
  if (this.appPause) {
    console.log('pause caused by APP');
    this.appPause = false; // Reset the flag
  } else {
    this.sendVideoState()
  }
}

YoutubeController.prototype.seekedListener = function() {
  if (this.appSeek) {
    console.log('seeked caused by APP');
    this.appSeek = false; // Reset the flag
  } else {
    this.sendVideoState()
  }
}

YoutubeController.prototype.play = function() {
  console.log('Trying to play')
  var paused = this.video.paused;
  if (paused){
    this.appPlay = true;
    this.video.play();
  }
}

YoutubeController.prototype.pause = function() {
  console.log('Trying to pause')
  var paused = this.video.paused;
  if (!paused){
    this.appPause = true;
    this.video.pause();
  }
}

YoutubeController.prototype.seek = function(time) {
  console.log('Seeking to ' + time)
  this.appSeek = true;
  this.video.currentTime = time;
}

YoutubeController.prototype.messageHandler = function(request, sender, sendResponse) {
  
  var currentTime = this.video.currentTime
  if (currentTime < request.time - 0.5 || currentTime > request.time + 0.5) { 
    this.seek(request.time)
  }
  
  if (request.state == utils.state.PLAYING) {
    this.play()
  }
  
  else if (request.state == utils.state.PAUSED) {
    this.pause()
  }
}

function initController(){
  var controller = new YoutubeController();
  controller.pause();
    
  // Listen to key presses
  window.onkeydown = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    
    if (key == 'A'.charCodeAt()) {
      controller.play();
    }
    
    if (key == 'S'.charCodeAt()) {
      controller.pause()
    }
    
    if (key == 'D'.charCodeAt()) {
      controller.seek(100)
    }
    
  };
    
  // Listen to page refresh or exit
  window.addEventListener('unload', function() {
    chrome.runtime.sendMessage({state : utils.state.UNLOADED});
  });
};

// Initialize the controller when the script is injected
console.log('YoutubeController injected');
window.onload = initController();