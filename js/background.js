/******************************************************************************
 * File: addListers.js
 * Desc: injects listeners to the video controls
 * Author: Fabrice Dugas
 * Year: 2016
 *****************************************************************************/

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

chrome.pageAction.onClicked.addListener(function (tab) {
	chrome.tabs.executeScript(null, {file : './js/inject.js'});
});
