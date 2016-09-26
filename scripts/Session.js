/******************************************************************************
 * File: Session.js
 * Desc: Represents a session
 * Author: Fabrice Dugas
 *****************************************************************************/
 
/**
 * Create a new session
 *
 * @param {string} owner - Session's owner
 * @return {boolean} true if session was created
 */
function Session(owner) {
  this.timeCreated = new Date();
  this.ref = null;
  this.key = null;
  this.owner = owner;
  this.participantsRef = null
  this.userRef = null;
  
  //TODO: Create new session on firebase
  return true;
}

/**
 * Create an exisiting session
 *
 * @param {string} key - Session's key
 * @param {string} owner - Session's owner
 * @param {array} participants - Session's participants
 * @return {boolean} true if session was created
 */
function Session(key) {
  this.key = key;
  this.ref = firebase.database().ref('sessions/' + this.key);
  this.participantsRef = this.ref.child('participants');
  this.userRef = null;
  
  var sucess = false;
  
  // Read owner and time created
  this.ref.on("value", function(data) {
    var val = data.val();
    this.owner = val.owner;
    this.timeCreated = val.timeCreated;
    success = true;
  }.bind(this), function(error) {
    console.log("Couldn't read existing session: " + error.code);
    success = false;
  });
  
  return success;
}

/**
 * Returns a Firebase object referencing the child specified by the path
 *
 * @param {string} path - Child's path
 * @return {Firebase} reference to child
 */
Session.prototype.child = function(path) {
  return this.ref.child(path);
}

/**
 * Join existing session
 *
 * @return {boolean} true if user joined successfully
 */
Session.prototype.join = function() {
  var currentUser = firebase.auth().currentUser;
  var date = new Date();
  
  var success = false;
  
  this.userRef = this.participantsRef.push();
  this.userRef.set({
    name: currentUser.displayName,
    timeJoined : date.getTime()
  })
  .then(function() {
    console.log(currentUser.displayName + ' joined ' + this.owner + '\'s session');
    success = true;
  }.bind(this))
  .catch(function(error) {
    console.error('Error joining the session', error);
    success = false;
  });
  
  return success;
 
}

/**
 * Leave existing session
 */
Session.prototype.leave = function() {
  // Remove participant from firebase
}

Session.prototype.sendMessage = function(msg) {
  chrome.runtime.sendMessage(msg);
}