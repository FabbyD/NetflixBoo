/******************************************************************************
 * File: FirebaseSession.js
 * Desc: Represents a session in Firebase
 * Author: Fabrice Dugas
 * Date: 07/01/2017
 *****************************************************************************/

// Create a session and add the current user to it
function FirebaseSession(key) {
  this._ref = null;
  this._userRef = null;
  
  if (key) {
    this._ref = firebase.database().ref('sessions/' + key);
  } else {
    this._new();
  }
  
  this.join();
  
  // Add listener to video state
  this._ref.child('video').on('value', this.videoListener.bind(this));
  
  // Kill the session if there are no participants left
  // TODO Change to be specific to child 'participants'
  this._ref.on('child_removed', this.kill.bind(this))
}

// Create a new session
FirebaseSession.prototype._new = function() {
  var currentUser = firebase.auth().currentUser;
  this._ref = firebase.database().ref('sessions').push();
  var date = new Date();
  this._ref.set({
      owner: currentUser.displayName,
      timeCreated : date,
      video : {
        state : utils.state.INIT,
        lastTimePushed : date.getTime(),
        lastUpdatedTime : 0,
        user : utils.state.INIT
      }
    })
    .then(function() {
      console.log('New session created!')
    })
    .catch(function(error) {
      console.error('Error creating new session.', error)
    })
}

// Add the current user to the session
FirebaseSession.prototype.join = function(onSuccess) {
  var currentUser = firebase.auth().currentUser;
  var participantsRef = this._ref.child('participants');
  var date = new Date();
  this._userRef = participantsRef.push();
  this._userRef.set({
    name: currentUser.displayName,
    timeJoined : date.getTime()
  })
  .then(function() {
    console.log('User joined session');
    if (onSuccess) onSuccess();
  })
  .catch(function(error) {
    console.error('Error joining the session', error);
  });
  
  // if user is first to join, set him to last user
  // this._ref.child('video').once('value', function(videoSnapshot) {
    // var val = videoSnapshot.val();
    // if (val.user == utils.state.INIT) {
      // this._ref.child('video').child('user').set(this._userRef.key);
    // }
  // }.bind(this));
}

// Remove the current user from the session
FirebaseSession.prototype.leave = function(onSuccess) {
  var onComplete = function(error) {
    if (error) {
      console.log('User removal failed');
    } else {
      console.log('User removal succeeded');
      onSuccess();
    }
  };
  this._userRef.remove(onComplete);
  this._userRef = null;
}

// Listen to video changes in firebase
FirebaseSession.prototype.videoListener = function(video) {
  var val = video.val();
  console.log('Received new video state:', val);
  if (val && val.user != this._userRef.key && utils.isVideoAction(val.state)) {
    AppController.doAction(val.state, val.lastUpdatedTime);
  }
}

// Remove the session from firebase
FirebaseSession.prototype.kill = function() {
  this._ref.remove();
  this._ref = null;
  this._userRef = null;
}

// Send video state to firebase
FirebaseSession.prototype.sendVideoState = function(state, time) {
  var video = this._ref.child('video');
  var date = new Date();
  video.set({
    user  : this._userRef.key,
    lastTimePushed : date.getTime(),
    state : state,
    lastUpdatedTime : time
  });
}