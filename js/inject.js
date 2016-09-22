/******************************************************************************
 * File: injectListers.js
 * Desc: injects code to listen and control video player
 * Author: Fabrice Dugas
 * Year: 2016
 *****************************************************************************/

console.log('inject');

function mouseEvent(type, sx, sy, cx, cy) {
	var e = {
		bubbles : true,
		cancelable : (type != "mousemove"),
		view : window,
		detail : 0,
		screenX : sx,
		screenY : sy,
		clientX : cx,
		clientY : cy,
		button : 0
	};

	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent(type,
		e.bubbles, e.cancelable, e.view, e.detail,
		e.screenX, e.screenY, e.clientX, e.clientY,
		e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
		e.button, document.body.parentNode);

	evt.button = {
		0 : 1,
		1 : 4,
		2 : 2
	}
	[evt.button] || evt.button;

	return evt;
}

// Listen to play button
var playButton = document.getElementsByClassName("player-control-button player-play-pause")[0];
playButton.addEventListener('click', function () {
	console.log('play/pause button');
});

// DEBUG //////////////////////

var handle = document.getElementsByClassName('player-scrubber-handle')[0];
handle.addEventListener('mouseup', function(e){
  console.log('Drop   - X: ' + e.clientX + " Y: " + e.clientY);
});

///////////////////////////////

// Convert a time in seconds to a position on the slider
function time2pos(time){
  // Get scrubber dimensions
  var scrubber = document.getElementById('scrubber-component');
  var rect = scrubber.getBoundingClientRect()
  var offsetLeft = rect.left;
  var width = rect.width;
  
  // Only used to get video properties
  // Setting anyting with video crashes the page sadly...
  var video = document.getElementsByTagName('video')[0];
  var videoLength = video.seekable.end(0);
  var prct = time/videoLength;
  
  console.log('%: ' + prct);
  
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
  
  // Only used to get video properties
  // Setting anyting with video crashes the page
  var video = document.getElementsByTagName('video')[0];
  
	//TODO: Calculate position to seek to
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
