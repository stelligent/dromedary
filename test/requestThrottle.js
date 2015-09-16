var expect      = require("chai").expect;
var reqThrottle = require("../lib/requestThrottle.js");

describe("requestThrottle", function() {
  describe(".logIp()", function() {
    beforeEach(function() {
      reqThrottle.clearIpMap();
      reqThrottle.logIp('127.0.0.1');
    });

    it("adds ip to map", function() {
      expect(reqThrottle.ipIsInMap('127.0.0.1')).to.be.true;
    });
  });

  describe(".checkIp()", function() {
    beforeEach(function() {
      reqThrottle.clearIpMap();
      reqThrottle.logIp('127.0.0.1', Date.now() + 1000);
      reqThrottle.logIp('127.0.0.2', Date.now() - 1000);
    });

    it("does throttle mapped ip", function() {
      expect(reqThrottle.checkIp('127.0.0.1')).to.be.false;
    });

    it("does not throttle mapped ip after blackoutPeriod", function() {
      expect(reqThrottle.checkIp('127.0.0.2')).to.be.true;
    });

    it("does not throttle unmapped ip", function() {
      expect(reqThrottle.checkIp('127.0.0.3')).to.be.true;
    });
  });

  describe(".gcMap()", function() {
    beforeEach(function() {
      reqThrottle.clearIpMap();
      reqThrottle.logIp('127.0.0.1', Date.now() + 1000);
      reqThrottle.logIp('127.0.0.2', Date.now() - 1000);
      reqThrottle.gcMap();
    });
    it("removes expired ip", function() {
      expect(reqThrottle.ipIsInMap('127.0.0.2')).to.be.false;
    });
    it("does not remove unexpired ip", function() {
      expect(reqThrottle.ipIsInMap('127.0.0.1')).to.be.true;
    });
  });
});
