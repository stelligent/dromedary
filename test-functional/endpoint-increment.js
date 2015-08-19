var expect    = require("chai").expect;
var request   = require('urllib-sync').request;

var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';
var chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
var color = chartData[0].label.toLowerCase();
var initialColorCount = chartData[0].value;
var expectedNewColorCount = initialColorCount + 1;
var incrementResponse = JSON.parse(request(targetUrl + '/increment?color=' + color).data.toString('utf-8'));
var newColorCounts = JSON.parse(request(targetUrl + '/data?countsOnly').data.toString('utf-8'));

describe("Increment endpoint", function() {
  it("Returns new count", function() {
    expect(incrementResponse.count).to.equal(expectedNewColorCount);
  });
});

describe("New Color Count", function() {
  it("Match expected value", function() {
    expect(newColorCounts[color]).to.equal(expectedNewColorCount);
  });
});
