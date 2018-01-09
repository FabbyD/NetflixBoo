/******************************************************************************
 * File: firebase_interface.js
 * Desc: Interface to communicate with Firebase server
 * Author: Fabrice Dugas
 * Date: 07/01/2017
 *****************************************************************************/
 
var FirebaseInterface = {}

// Save video state in server
FirebaseInterface.sendVideoState = function() {
  var video = this.session.child('video');
  var date = new Date();
  
  video.set({
    user  : this.session.userRef.key,
    state : state,
    lastUpdatedTime : time,
    lastTimePushed  : date.getTime()
  });
}

// Receive new video state from server
FirebaseInterface.receiveVideoState = function() {
  
}

// Save session state in server
FirebaseInterface.sendSessionState = function() {
  
}

// Receive new session state from server
FirebaseInterface.receiveSessionState = function() {
  
}

