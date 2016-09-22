/******************************************************************************
 * File: netflixboo.js
 * Desc: injects code to control and listen to video player
 * Author: Fabrice Dugas
 *****************************************************************************/

console.log('videoController injected');
 
// video should only be used as getter
var video;
var playButton;

function init(){
  video =  document.getElementsByTagName('video')[0];
  playButton = document.getElementsByClassName("player-control-button player-play-pause")[0];
  
  // Listen to play button
  playButton.addEventListener('click', function(e){
    if (!e.fake) {
      console.log('play/pause button');
      var paused = video.paused;
      var currTime = video.currTime;
      chrome.runtime.sendMessage({greeting : 'PlayButton', paused : paused, currTime : currTime});
    }
  });
  
  //TODO: Listen to seek
  var slider = document.getElementsByClassName('player-slider')[0];
  slider.onclick = function(e) {
    console.log(e.fake ? 'Fake slider click' : 'Slider click');
  };
  
  // Listen to key presses
  window.onkeydown = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;

    // Space bar
    if (key == 32) {
      console.log('space bar');
    }

    // a
    else if (key == 65) {
      seek(120);
    }
  };

  pause();
  console.log('video paused');
};

// Play video
function play(){
  var paused = video.paused;
  if (paused){
    var click = mouseEvent('click', 0, 0, 0, 0);
    playButton.dispatchEvent(click);
  }
};

// Pause video
function pause(){
  var paused = video.paused;
  if (!paused){
    var click = mouseEvent('click', 0, 0, 0, 0);
    playButton.dispatchEvent(click);
  }
};

// Convert time in seconds to a position on the slider
function time2pos(time){
  // Get scrubber dimensions
  var scrubber = document.getElementById('scrubber-component');
  var rect = scrubber.getBoundingClientRect();
  var offsetLeft = rect.left;
  var width = rect.width;
  
  var videoLength = video.seekable.end(0);
  var prct = time/videoLength;
  
  var pos = offsetLeft + Math.round(prct*width);
  return pos;
};

// Seek to specified time in seconds
function seek(time){
	// Get position of target's center
	var target = document.getElementsByClassName('player-scrubber-target')[0];
  var rect = target.getBoundingClientRect()
  var centerX = rect.left + Math.round(rect.width / 2)
  var centerY = rect.top + Math.round(rect.height / 2);
  
	// Calculate position to seek to
	var posX = time2pos(time);
	var posY = centerY;

  // Grab handle...
  var handle = document.getElementsByClassName('player-scrubber-handle')[0];
  var grab = mouseEvent("mousedown", centerX, centerY, centerX, centerY);
  handle.dispatchEvent(grab);
  
  // ... drag to seek position...
  var drag = mouseEvent("mousemove", posX, posY, posX, posY);
  handle.dispatchEvent(drag);
  
  // ... and finally drop
  var drop = mouseEvent("mouseup", posX, posY, posX, posY);
  handle.dispatchEvent(drop);
  
};

init();