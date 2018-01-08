/******************************************************************************
 * File: init.js
 * Desc: Script to initialize the chrome extension and set the version.
 * The version variable defines which website the extension is activated for.
 * Supported platforms are:
 *    0 : Netflix,
 *    1 : Youtube,
 *    2: 123movies;
 * Author: Fabrice Dugas
 * Date: 07/01/2017
 *****************************************************************************/

/** 
  Temporary way to set the version of the app
  0 : Netflix,
  1 : Youtube,
  2: 123movies
**/
var version = 0;

// Netflix
var netflix = {
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

// Youtube
var youtube = {
  conditions : [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl : {
        hostEquals : 'www.youtube.com',
        schemes : ['https'],
        pathPrefix : '/watch'
      }
    })
  ],
  actions : [new chrome.declarativeContent.ShowPageAction()]
};

// 123movies
var movies = {
  conditions : [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl : {
        hostEquals : '123movies.is',
        schemes : ['https'],
        pathPrefix : '/film'
      }
    })
  ],
  actions : [new chrome.declarativeContent.ShowPageAction()]
};

var rules = [netflix, youtube, movies]

chrome.runtime.onInstalled.addListener(function (details) {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([rules[version]]);
  });
});