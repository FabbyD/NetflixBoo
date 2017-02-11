/******************************************************************************
 * File: utilities.js
 * Desc: Various utilities to be used in Netflix Boo
 * Author: Fabrice Dugas
 *****************************************************************************/

var utils = {};

utils.state = {
   PLAYING : 'playing',
   PAUSED : 'paused',
   CONNECTED : 'connected',
   UNLOADED : 'unloaded'
};

utils.popup = {}

utils.popup.requests = {
  INIT_UI        : 1,
  ACTIVATE       : 2,
  // IS_ACTIVATED   : 2,
  CREATE_SESSION : 3,
  JOIN_SESSION   : 4,
  LEAVE_SESSION  : 5,
  GET_SESSION    : 6
}

// Check if current url is Netflix
var onNetflix = function(url) {
  return url.match(/https:\/\/www.netflix.com\/watch\//)
}

// Check if current url is Youtube
var onYoutube = function(url) {
  return url.match(/https:\/\/www.youtube.com\/watch/)
}

utils.onPage = [onNetflix, onYoutube];
