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

window.onclick = function(e){
  console.log('X: ' + e.clientX + " Y: " + e.clientY);
}

// Seek to specified time in seconds
var seek = function (time) {
	console.log('Seek time:' + time);

	// Get position of target's center
	var target = document.getElementsByClassName('player-scrubber-target')[0];
	console.log(target);
  var rect = target.getBoundingClientRect()
  var centerX = rect.left + Math.floor(rect.width / 2)
  var centerY = rect.top + Math.floor(rect.height / 2);
  
	console.log('CenterX: ' + centerX);
	console.log('CenterY: ' + centerY);

	//TODO: Calculate position to simulate click
	var posX = centerX + 100;
	var posY = centerY;

	// Make slider appear
	var moveEvt = mouseEvent("mousemove", 1, 50, 1, 50);
	window.dispatchEvent(moveEvt);
  
  // Wait for UI...
	setTimeout(function () {
		console.log('Slider de malheur!');
    // Then click at the appropriate position
    //TODO: Put focus on slider??
    var clickEvt = mouseEvent("click", posX, posY, posX, posY);
    window.dispatchEvent(clickEvt);
	}, 10);
 
}

// Listen to key presses
window.onkeydown = function (e) {
	var key = e.keyCode ? e.keyCode : e.which;
	console.log(key);

	// Space bar
	if (key == 32) {
		console.log('space bar');
	}

	// a
	else if (key == 65) {
		seek(60);
	}
};
