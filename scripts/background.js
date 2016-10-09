/******************************************************************************
 * File: background.js
 * Desc: Acts as overall manager. Dispatches messages between scripts and Fire-
 * base, has an internal lasting state and initializes the PageAction
 * Author: Fabrice Dugas
 *****************************************************************************/

// PageAction shenanigans
var rule1 = {
	conditions : [
		new chrome.declarativeContent.PageStateMatcher({
			pageUrl : {
				hostEquals : 'www.netflix.com',
				schemes : ['https'],
				pathPrefix : '/watch/'
			}
		})
	],
	actions : [new chrome.declarativeContent.ShowPageAction()]
};

chrome.runtime.onInstalled.addListener(function (details) {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
		chrome.declarativeContent.onPageChanged.addRules([rule1]);
	});
});

/**
 * Manager for netflix boo
 */
function Manager() {
  // Keeps track of activation
  this.activated = false;
  
  // Listen for messages from scripts
  chrome.runtime.onMessage.addListener(this.messageHandler.bind(this));
  
  this.initFirebase();
  this.session = null;
  
  this.sessionsRef = this.database.ref('sessions');
  
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
// Stole from github.com/friendlychat
Manager.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
Manager.prototype.onAuthStateChanged = function(user) {
  console.log('User state change detected from the Background script:', user);
}

Manager.prototype.messageHandler = function(request, sender, sendResponse) {
  if (sender.tab) {
    this.handleControllerMsg(request, sender, sendResponse)
  }
  
  else if (request.greeting == 'activate') {
    sendResponse(this.activated)
    this.activated = true
  }
  
  else if (request.greeting == 'isActivated') {
    sendResponse(this.activated)
  }
  
  else if (request.greeting == 'createSession') {
    this.session = new Session()
    
    // Add listener to new actions
    var videoRef = this.session.child('video')
    videoRef.on('child_changed', this.handleNewAction.bind(this))
    
    var farewell = {
      key   : this.session.key,
      owner : this.session.owner
    }
    sendResponse(farewell)
  }
  
  else if (request.greeting == 'joinSession') {
    this.session = new Session(request.sessionKey, request.owner)
    this.session.join()
    
    // Add listener to new actions
    var videoRef = this.session.child('video')
    videoRef.on('child_changed', this.handleNewAction.bind(this))
    
    var farewell = {
      key   : this.session.key,
      owner : this.session.owner
    }
    sendResponse(farewell)
  }
  
  else if (request.greeting == 'leaveSession') {
    console.log('Background leaving session')
    this.removeUserFromSession(sendResponse)
  }
  
  else if (request.greeting == 'getSession') {
    var farewell = !this.session ? null : {
      key : this.session.key,
      owner : this.session.owner
    }
    sendResponse(farewell)
  }
  
}

Manager.prototype.handleControllerMsg = function(request, sender, sendResponse) {
  if (this.connected() && (request.state == utils.state.PLAYING || request.state == utils.state.PAUSED)) {
    console.log('Video ' + request.state + ' at ' + request.time);
    this.updateFirebase(request.state, request.time);
  }

  else if (request.state == utils.state.UNLOADED) {
    console.log('Netflix unloaded');
    this.unloadApp();
  }
}

Manager.prototype.updateFirebase = function(state, time) {
  
  var video = this.session.child('video');
  var date = new Date();
  
  video.set({
    info : {
      user  : this.session.userRef.key,
      state : state,
      lastUpdatedTime : time,
      lastTimePushed  : date.getTime()
    }
  })
}

Manager.prototype.handleNewAction = function(video) {
  var val = video.val();
  var key = video.key;
  
  console.log('new action')
  console.log(val)
  
  if (val.user != this.session.userRef.key) {
    console.log('Action from other user: ' + val.state + ' ' + val.lastUpdatedTime);
    this.sendMessage(val.state, val.lastUpdatedTime);
  }
  else {
    console.log('Action from myself: ' + val.state + ' ' + val.lastUpdatedTime);
  }

}

Manager.prototype.removeUserFromSession = function(callback) {
  if (this.connected()) {
    var onSuccess = function() {
      if (callback) callback()
      this.session = null
    }.bind(this)
    this.session.leave(onSuccess)
  }
}

Manager.prototype.unloadApp = function() {
  this.removeUserFromSession();
  this.activated = false;
  this.session = null;
}

Manager.prototype.connected = function() {
  return (this.session && this.session.userRef);
}

Manager.prototype.sendMessage = function(state, time) {
  if (this.activated) {
    console.log('Trying to send message: ' + state + ' ' + time);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (utils.isNetflixOn(tabs[0].url)) {
        console.log('In netflix')
        chrome.tabs.sendMessage(tabs[0].id, {state : state, time : time}); 
      }
    });
  }
}

function initApp() {
  var manager = new Manager();
}

window.onload = function() {
  initApp();
};
