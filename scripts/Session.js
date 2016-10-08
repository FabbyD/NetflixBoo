/******************************************************************************
 * File: Session.js
 * Desc: Represents a session
 * Author: Fabrice Dugas
 *****************************************************************************/

/**
 * Create a session
 *
 * @param {string} key - Session's key
 * @param {string} owner - Session's owner
 */
function Session(key, owner) {
  // Existing session
  if (key && owner) {
    this.key = key;
    this.owner = owner;
    this.ref = firebase.database().ref('sessions/' + this.key);
    this.participantsRef = this.ref.child('participants');
    this.userRef = null;
    
    // Read time created
    this.ref.on("value", function(data) {
      var val = data.val();
      this.timeCreated = val.timeCreated;
    }.bind(this), function(error) {
      console.log("Couldn't read existing session: " + error.code);
    });
  }
  
  // New session
  else if (!key && !owner) {
    this.timeCreated = new Date();
    this.owner = firebase.auth().currentUser.displayName;
    this.userRef = null;
    
    this.ref = firebase.database().ref('sessions').push();
    this.ref.set({
      owner: this.owner,
      timeCreated : this.timeCreated,
      video : {
        info : {
          state : 'init',
          lastTimePushed : this.timeCreated.getTime(),
          lastUpdatedTime : 0,
          user : 'init'
        }
      }
    })
    .then(function() {
      console.log('New session created!')
    })
    .catch(function(error) {
      console.error('Error creating the session.', error)
    })
    
    this.participantsRef = this.ref.child('participants');
    this.key = this.ref.key;
    
    // Add current user to participants list
    this.join()
  }
  
  else {
    console.error('Error creating session.')
  }
  
  // Kill the session if there are no participants left
  this.ref.on('child_removed', this.kill.bind(this))
  
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
 * @param {callback} onSuccess callback when operation is successful
 */
Session.prototype.join = function(onSuccess) {
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
    if (onSuccess) {
      var farewell = {
        key   : this.key,
        owner : this.owner
      }
      onSuccess(farewell)
    }
  }.bind(this))
  .catch(function(error) {
    console.error('Error joining the session', error);
  });
}

/**
 * Leave existing session
 */
Session.prototype.leave = function(onSuccess) {
  console.log('Leaving session');
  // Remove participant from firebase
  var onComplete = function(error) {
    if (error) {
      console.log('User removal failed');
    } else {
      console.log('User removal succeeded');
      onSuccess();
    }
  };
  this.userRef.remove(onComplete);
}

/**
 * Removes the session from firebase.
 * Fired when there are no participants left.
 */
Session.prototype.kill = function() {
  this.ref.remove();
}

Session.prototype.sendMessage = function(msg) {
  chrome.runtime.sendMessage(msg)
}