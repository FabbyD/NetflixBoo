/******************************************************************************
 * File: simulateMouse.js
 * Desc: functions to simulate mouse events. Event.fake property allows
 *       handlers to manage simulated events differently (i.e. ignore them)
 * Author: Fabrice Dugas
 *****************************************************************************/
 
console.log('mouseSimulator injected'); 

// Creates a fake MouseEvent
function createFakeMouseEvent(type, cx, cy) {
  var mouseEventInit = {
    bubbles : true,
    cancelable : true,
    view : window,
    clientX : cx,
    clientY : cy
  };
  
  var evt = new MouseEvent(type, mouseEventInit)
  
  evt.fake = true;
  
  return evt;
}