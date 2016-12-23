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
  ACTIVATE       : 1,
  IS_ACTIVATED   : 2,
  CREATE_SESSION : 3,
  JOIN_SESSION   : 4,
  LEAVE_SESSION  : 5,
  GET_SESSION    : 6
}

utils.isNetflixOn = function(url) {
  return url.match(/https:\/\/www.netflix.com\/watch\//)
}