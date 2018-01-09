/******************************************************************************
 * File: utilities.js
 * Desc: Various helpers to be used in Netflix Boo
 * Author: Fabrice Dugas
 *****************************************************************************/

var utils = {};

utils.state = {
  INIT : 'init',
  PLAYING : 'playing',
  PAUSED : 'paused',
  CONNECTED : 'connected',
  UNLOADED : 'unloaded'
};

utils.popup = {}

utils.popup.requests = {
  INIT_UI        : 1,
  ACTIVATE       : 2,
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

// Check if current url is Youtube
var onMovies = function(url) {
  return url.match(/https:\/\/123movies.is\/film/)
}

utils.onPage = [onNetflix, onYoutube, onMovies];

utils.isVideoAction = function(state) {
  return state == utils.state.PLAYING || state == utils.state.PAUSED;
}