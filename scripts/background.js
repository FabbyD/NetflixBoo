/******************************************************************************
 * File: background.js
 * Desc: Dispatches messages between the various modules of the extension
 * Author: Fabrice Dugas
 * Date: 07/01/2017
 *****************************************************************************/
 
var controller = {
  activated : false,
  session : null,
  
  messageListener : function(request, sender, sendResponse) {
    console.log('Received message:', request)
    if (sender.tab) {
      this.handleControllerMsg(request, sender, sendResponse)
    }
    else {
      this.handleUIMsg(request, sender, sendResponse)
    }
    return request.async;
  },
  
  handleControllerMsg : function(request, sender, sendResponse) {
    if (this.connected() && (request.state == utils.state.PLAYING || request.state == utils.state.PAUSED)) {
      this.session.sendVideoState(request.state, request.time);
    }
    else if (request.state == utils.state.UNLOADED) {
      this.unloadApp();
    }
  },
  
  handleUIMsg : function(request, sender, sendResponse) {
    switch(request.type) {
      case requester.INIT_UI:
        var session = this.session ? {
            key : this.session.key,
            owner : this.session.owner
          } : null
        var response = {
          isActive : this.activated,
          session  : session
        }
        sendResponse(response);
        break;
      
      case requester.IS_ACTIVATED:
        sendResponse(this.activated);
        break;
      
      case requester.ACTIVATE:
        sendResponse(this.activated);
        this.activated = true;
        break;
        
      case requester.CREATE_SESSION:
        this.createSession(sendResponse);
        break;
        
      case requester.JOIN_SESSION:
        this.joinSession(request.data, sendResponse);
        break;
        
      case requester.LEAVE_SESSION:
        this.leaveSession(sendResponse);
        break;
        
      case requester.GET_SESSION:
        if (this.session) {
          this.session.serialize(sendResponse);
        }
        break;
        
      default:
        console.log('Received unknown request.');
        break;
    };
  },
    
  createSession : function(sendResponse) {
    this.session = new FirebaseSession();
    this.session.create(true, sendResponse);
  },

  joinSession : function(key, sendResponse) {
    this.session = new FirebaseSession(key);
    this.session.join(sendResponse);
  },

  leaveSession : function(callback) {
    if (this.connected()) {
      var onSuccess = function() {
        if (callback) callback();
        this.session = null;
      }.bind(this);
      this.session.leave(onSuccess);
    }
  },

  unloadApp : function() {
    this.leaveSession();
    this.activated = false;
    this.session = null;
  },

  connected : function() {
    return this.session != undefined;
  },

  trySending : function(state, time) {
    // send the video state only if netflix is the current tab
    console.log('Trying to send new action');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && utils.onPage[version](tabs[0].url)) {
        chrome.tabs.sendMessage(tabs[0].id, {state : state, time : time});
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }.bind(this));
    this.tryCount += 1;
    
    if (this.tryCount >= 120) {
      clearInterval(this.intervalId);
      this.invervalId = null;
    }
  },

  doAction : function(state, time) {
    // try to send the new video state to the netflix tab
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.tryCount = 0
    if (this.activated) {
      this.intervalId = setInterval(function() {
        this.trySending(state, time);
      }.bind(this), 500)
    }
  }
}

function initApp() {
  // start listening to messages from scripts
  chrome.runtime.onMessage.addListener(controller.messageListener.bind(controller));
}

window.onload = initApp;
