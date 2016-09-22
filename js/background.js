/******************************************************************************
 * File: background.js
 * Desc: Acts as overall manager. Dispatches messages between scripts and Fire-
 * base, has an internal lasting state and initializes the PageAction
 * Author: Fabrice Dugas
 *****************************************************************************/

var activated = false;
 
// Initialize Firebase
var config = {
  apiKey: "AIzaSyDVt3hs8xgCxZRnIVahX8zvg5rjb2IF-Z4",
  authDomain: "netflix-boo.firebaseapp.com",
  databaseURL: "https://netflix-boo.firebaseio.com",
  storageBucket: "netflix-boo.appspot.com",
  messagingSenderId: "561430015544"
};
firebase.initializeApp(config);
 
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
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('User state change detected from the Background script:', user);
  });
  
  // Listen for messages between scripts
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (sender.tab) {
        console.log('Msg from: ' + sender.tab.url);
      }
      
      else if (request.greeting == 'activate') {
        sendResponse(activated);
        activated = true;
      }
      
      else if (request.greeting == 'isActivated') {
        sendResponse(activated);
      }
  });
}

window.onload = function() {
  initApp();
};
