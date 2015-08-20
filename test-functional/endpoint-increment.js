var expect    = require("chai").expect;
var request   = require('urllib-sync').request;

var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

describe("Increment endpoint", function() {
  var chartData;
  var color;
  var initialColorCount;
  var expectedNewColorCount;
  var incrementResponse;
  var newColorCounts;

  before(function() {
    chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
    color = chartData[0].label.toLowerCase();
    initialColorCount = chartData[0].value;
    expectedNewColorCount = initialColorCount + 1;
    incrementResponse = JSON.parse(request(targetUrl + '/increment?color=' + color).data.toString('utf-8'));
    newColorCounts = JSON.parse(request(targetUrl + '/data?countsOnly').data.toString('utf-8'));
  });

  it("Returns new count", function() {
    expect(incrementResponse.count).to.equal(expectedNewColorCount);
  });

  it("New count matches expected value", function() {
    expect(newColorCounts[color]).to.equal(expectedNewColorCount);
  });
});
