/******************************************************************************
 * File: utilities.js
 * Desc: Various utilities to be used in Netflix Boo
 * Author: Fabrice Dugas
 *****************************************************************************/

var utils = {};

utils.keys = {
  a : 65,
  space : 32
};

utils.state = {
   PLAYING : 'playing',
   PAUSED : 'paused',
   CONNECTED : 'connected',
   UNLOADED : 'unloaded'
};

//TODO: Add request types here
utils.request = {
  
};

utils.isNetflixOn = function(url) {
  return url.match(/https:\/\/www.netflix.com\/watch\//)
}