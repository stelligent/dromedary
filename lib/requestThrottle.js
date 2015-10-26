'use strict';

var Module = (function () {

  var requestThrottle = {};
  var blackoutPeriod = 100;
  var ipMap = {};

  requestThrottle.clearIpMap = function () {
    ipMap = {};
  };

  requestThrottle.gcMap = function () {
    var ip;
    var t = Date.now();
    for (ip in ipMap) {
      if (ipMap.hasOwnProperty(ip) && t > ipMap[ip]) {
        console.log('Deleted ip from throttle map: ' + ip);
        delete ipMap[ip];
      }
    }
  };

  requestThrottle.setBlackoutPeriod = function (milliseconds) {
    blackoutPeriod = milliseconds;
    return blackoutPeriod;
  };

  requestThrottle.getBlackoutPeriod = function () {
    return blackoutPeriod;
  };

  requestThrottle.logIp = function (ipAddress, expiration) {
    if (!expiration) {
      expiration = Date.now() + blackoutPeriod;
    }
    ipMap[ipAddress] = expiration;
  };

  requestThrottle.ipIsInMap = function (ipAddress) {
    return ipMap.hasOwnProperty(ipAddress);
  };

  requestThrottle.checkIp = function (ipAddress) {
    if (ipMap.hasOwnProperty(ipAddress)) {
      if (Date.now() < ipMap[ipAddress]) {
        return false;
      }
    }
    return true;
  };

  return requestThrottle;
}());

module.exports = Module;
