var expect    = require("chai").expect;
var request   = require('urllib-sync').request;

var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

describe("/increment", function() {
  beforeEach(function() {
    var chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
    var initialColorCount = chartData[0].value;

    this.color = chartData[0].label.toLowerCase();
    this.expectedNewColorCount = initialColorCount + 1;
    this.incrementResponse = JSON.parse(request(targetUrl + '/increment?color=' + this.color).data.toString('utf-8'));
    this.newColorCounts = JSON.parse(request(targetUrl + '/data?countsOnly').data.toString('utf-8'));
  });

  it("returns new count", function() {
    expect(this.incrementResponse.count).to.equal(this.expectedNewColorCount);
  });

  it("new count matches expected value", function() {
    expect(this.newColorCounts[this.color]).to.equal(this.expectedNewColorCount);
  });
});
