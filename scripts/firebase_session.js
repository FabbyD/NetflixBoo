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
  this.owner = null;
  this._onRemoveSession = null;
  
  if (key) {
    this._ref = firebase.database().ref('sessions/' + key);
  }
}

FirebaseSession.loadLast = function(limit, callback) {
  var ref = firebase.database().ref('sessions');
  ref.limitToLast(limit).on('child_added', function(snapshot) {
    var session = {
      key: snapshot.key,
      owner: snapshot.val().owner
    };
    callback(session);
  });
}

FirebaseSession.onRemoveSession = function(callback) {
  var ref = firebase.database().ref('sessions');
  ref.on('child_removed', callback);
}

FirebaseSession.stopListening = function() {
  var ref = firebase.database().ref('sessions');
  ref.off();
}

FirebaseSession.prototype.serialize = function(callback) {
  this._ref.once('value', function(snapshot) {
    var serialized = {
      key: snapshot.key,
      owner: snapshot.val().owner
    };
    callback(serialized);
  });
}

// Create a new session
FirebaseSession.prototype.create = function(join, onSuccess) {
  var currentUser = firebase.auth().currentUser;
  this.owner = currentUser.displayName;
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
      if (join) {
        this.join(onSuccess);
      }
    }.bind(this))
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
    if (onSuccess) this.serialize(onSuccess);
  }.bind(this))
  .catch(function(error) {
    console.error('Error joining the session', error);
  });
  
  // Add listener to video state
  this._ref.child('video').on('value', this.videoListener.bind(this));
  
  // Kill the session if there are no participants left
  // FIXME Change to be specific to child 'participants'
  this._ref.on('child_removed', this.kill.bind(this));
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
    controller.doAction(val.state, val.lastUpdatedTime);
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