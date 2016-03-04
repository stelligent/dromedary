var expect    = require("chai").expect;
var rp        = require('request-promise');
var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

describe("/increment", function() {
    var chartData, initialColorCount, color, expectedNewColorCount;
    var incrementResponse, newColorCounts, badIncrementResponse;

    this.timeout(15000);

    before(function(done) {
    var apiBaseurl;

    rp({ uri: targetUrl+'/config.json', json:true})
        .then(function (data) {
          if(!data.apiBaseurl || data.apiBaseurl == '/') {
            apiBaseurl = targetUrl;
          } else {
            apiBaseurl = data.apiBaseurl;
          }

          return rp({ uri: apiBaseurl+'/data', qs: {nocache:true}, json:true});
        })
        .then(function(data) {
          chartData = data;
          initialColorCount = chartData[0].value;
          color = chartData[0].label.toLowerCase();
          expectedNewColorCount = initialColorCount + 1;

          return rp({ uri: apiBaseurl+'/increment',qs: {color: color}, json:true});
        })
        .then(function(data) {
            incrementResponse = data;
            return rp({ uri: apiBaseurl+'/data',qs: {nocache:true, countsOnly: true}, json:true});
        })
        .then(function(data) {
            newColorCounts = data;
            return rp({ uri: apiBaseurl+'/increment',qs: {color: 'UKNOWN'}, json:true});
        })
        .then(function(data) {
            badIncrementResponse = data;
            done();
        })
        .catch(function (err) {
          throw err;
        });
  });

  it("returns new count", function() {
    expect(incrementResponse.count).to.equal(expectedNewColorCount);
  });

  it("new count matches expected value", function() {
    expect(newColorCounts[color]).to.equal(expectedNewColorCount);
  });

  it("bad color produces error", function() {
    expect(badIncrementResponse.hasOwnProperty('error')).to.be.true;
  });
});
