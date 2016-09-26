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
    this.handleControllerMsg(request, sender, sendResponse);
  }
  
  else if (request.greeting == 'activate') {
    sendResponse(this.activated);
    this.activated = true;
  }
  
  else if (request.greeting == 'isActivated') {
    sendResponse(this.activated);
  }
  
  else if (request.greeting == 'joinSession') {
    this.session = new Session(request.sessionKey)
    this.session.join();
    
    // Add listener to new actions
    this.pushToFirebase(State.CONNECTED, 0);
    var actionsRef = this.session.child('actions');
    actionsRef.limitToLast(1).on('child_added', this.handleNewAction.bind(this));
  }
  
  else if (request.greeting == 'getSession') {
    sendResponse(this.session ? this.session.key : null);
  }
  
}

Manager.prototype.handleControllerMsg = function(request, sender, sendResponse) {
  if (this.connected()) {
  
    if (request.state == State.PLAYING || request.state == State.PAUSED) {
      console.log('Video ' + request.state + ' at ' + request.time);
      this.pushToFirebase(request.state, request.time);
    }

    else if (request.state == State.UNLOADED) {
      console.log('Netflix unloaded');
      this.unloadApp();
    }
  }
}

Manager.prototype.pushToFirebase = function(state, time) {
  
  var actionsRef = this.session.child('actions');
  var date = new Date();
  
  var newAction = {
    user : this.session.userRef.key,
    state : state,
    time : time,
    timePushed : date.getTime()
  };
  
  actionsRef.push(newAction);
}

Manager.prototype.handleNewAction = function(newAction) {
  var val = newAction.val();
  var key = newAction.key;
  
  if (key != 'init') {
    if (val.user != this.session.userRef.key) {
      console.log('Action from other user: ' + val.state + ' ' + val.time);
      sendMessage(val.state, val.time);
    }
    else {
      console.log('Action from myself: ' + val.state + ' ' + val.time);
    }
  }
}


Manager.prototype.removeUserFromSession = function() {
  if (this.connected()) {
    console.log('Session key and user key present');
    var sessionsRef = this.database.ref('sessions');
    var sessionRef = sessionsRef.child(this.session.key);
    if (sessionRef) {
      console.log('Removing user from session...');
      var userPath = 'participants/' + this.session.userRef.key;
      var userRef = sessionRef.child(userPath);
      
      var onComplete = function(error) {
        if (error) {
          console.log('User removal failed');
        } else {
          console.log('User removal succeeded');
        }
      };
      userRef.remove(onComplete);
    }
    
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
  console.log('Trying to send message: ' + state + ' ' + time);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {state : state, time : time});
  });
}

function initApp() {
  var manager = new Manager();
  
}

window.onload = function() {
  initApp();
};
