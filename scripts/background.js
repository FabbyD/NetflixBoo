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
  this.activated = false; // Keeps track of activation
  
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
  else {
    this.handleUIMsg(request, sender, sendResponse)
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

Manager.prototype.handleUIMsg = function(request, sender, sendResponse) {
  var rtype = utils.popup.requests;
  
  switch(request.greeting) {
    case rtype.INIT_UI:
      var session = !this.session ? null : {
          key : this.session.key,
          owner : this.session.owner
        }
      var response = {
        isActive : this.activated,
        session  : session
      }
      console.log('init ui');
      console.log(this.activated);
      console.log(session);
      sendResponse(response);
      break;
      
    case rtype.ACTIVATE:
      sendResponse(this.activated);
      this.activated = true;
      break;
      
    // case rtype.IS_ACTIVATED:
      // sendResponse(this.activated);
      // break;
      
    case rtype.CREATE_SESSION:
      this.createSession(sendResponse);
      break;
      
    case rtype.JOIN_SESSION:
      this.joinSession(request, sendResponse);
      break;
      
    case rtype.LEAVE_SESSION:
      this.removeUserFromSession(sendResponse)
      break;
      
    case rtype.GET_SESSION:
      var response = !this.session ? null : {
        key : this.session.key,
        owner : this.session.owner
      }
      sendResponse(response)
      break;
      
    default:
      console.log('Received unknown request.')
      break;
  };
}

Manager.prototype.createSession = function(sendResponse) {
  this.session = new Session();
    
  // Add listener to new actions
  var videoRef = this.session.child('video');
  videoRef.on('child_changed', this.handleNewAction.bind(this));
  
  var farewell = {
    key   : this.session.key,
    owner : this.session.owner
  };
  sendResponse(farewell);
}

Manager.prototype.joinSession = function(request, sendResponse) {
  this.session = new Session(request.sessionKey, request.owner);
  this.session.join();
  
  // Add listener to new actions
  var videoRef = this.session.child('video');
  videoRef.on('child_changed', this.handleNewAction.bind(this));
  
  var farewell = {
    key   : this.session.key,
    owner : this.session.owner
  };
  sendResponse(farewell);
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
  });
}

Manager.prototype.handleNewAction = function(video) {
  var val = video.val();
  
  console.log('new action');
  console.log(val);
  
  if (val.user != this.session.userRef.key) {
    console.log('Action from other user: ' + val.state + ' ' + val.lastUpdatedTime);
    this.sendLastAction(val.state, val.lastUpdatedTime);
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
    }.bind(this);
    this.session.leave(onSuccess);
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

Manager.prototype.trySending = function(state, time) {
  console.log('Trying to send new action');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && utils.isNetflixOn(tabs[0].url)) {
      chrome.tabs.sendMessage(tabs[0].id, {state : state, time : time});
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }.bind(this));
}

Manager.prototype.sendLastAction = function(state, time) {
  if (this.intervalId) clearInterval(this.intervalId); // Clear previous try
  
  if (this.activated) {
    this.intervalId = setInterval(function() {
      this.trySending(state, time)
    }.bind(this), 500)
  }
}

function initApp() {
  var manager = new Manager();
}

window.onload = initApp;
