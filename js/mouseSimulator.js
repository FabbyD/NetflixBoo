/******************************************************************************
 * File: simulateMouse.js
 * Desc: functions to simulate mouse events. Event.fake property allows
 *       handlers to act differently with simulated events (i.e. ignore them)
 * Author: Fabrice Dugas
 *****************************************************************************/
 
console.log('mouseSimulator injected');
 
// Creates a fake MouseEvent
function createFakeMouseEvent(type, sx, sy, cx, cy) {
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
  
  evt.fake = true;

	return evt;
}