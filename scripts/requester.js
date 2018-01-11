var requester = {
  INIT_UI        : 1,
  IS_ACTIVATED   : 2,
  ACTIVATE       : 3,
  CREATE_SESSION : 4,
  JOIN_SESSION   : 5,
  LEAVE_SESSION  : 6,
  GET_SESSION    : 7,
  
  request : function(rtype, callback) {
    chrome.runtime.sendMessage({
        type : rtype
      }, callback);
  }
}
