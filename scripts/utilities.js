/******************************************************************************
 * File: utilities.js
 * Desc: Various utilities to be used in Netflix Boo
 * Author: Fabrice Dugas
 *****************************************************************************/
 
var State = {
   PLAYING : 'playing',
   PAUSED : 'paused',
   CONNECTED : 'connected',
   UNLOADED : 'unloaded'
};

var SessionState = {
  JOINED : 'joined',
  FAILED : 'failed'
};

var Message = {
  
}

var utils = {
  isNetflixOn : function(url) {
    return url.match(/https:\/\/www.netflix.com\/watch\//)
  }
}