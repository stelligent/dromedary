var expect    = require("chai").expect;
var request   = require('urllib-sync').request;

var targetUrl   = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

var expectedNumberOfItems = 4;
// var expectedNumberOfItems = 5;
var expectedProperties = ['value', 'color', 'highlight', 'label'];

describe("/data", function() {
  beforeEach(function() {
    this.chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
  });

  it("response has exactly " + expectedNumberOfItems + " items", function() {
    expect(this.chartData).to.have.length(expectedNumberOfItems);
  });

  it("each item has exactly " + expectedProperties.length + " properties", function() {
    var index;
    for (index = 0; index < this.chartData.length; index++) {
      expect(Object.keys(this.chartData[index])).to.have.length(expectedProperties.length);
    }
  });

  it("each item has properties: " + expectedProperties, function() {
    var itemProperties;
    var itemIndex;
    var propIndex;
    for (itemIndex = 0; itemIndex < this.chartData.length; itemIndex++) {
      itemProperties = Object.keys(this.chartData[itemIndex]);
      for (propIndex = 0; propIndex < expectedProperties.length; propIndex++) {
        expect(itemProperties).to.contain(expectedProperties[propIndex]);
      }
    }
  });
});

describe("/data?countsOnly", function() {
  beforeEach(function() {
    this.chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
    this.colorCounts = JSON.parse(request(targetUrl + '/data?countsOnly').data.toString('utf-8'));
  });

  it("response has exactly " + expectedNumberOfItems + " keys", function() {
    expect(Object.keys(this.colorCounts)).to.have.length(expectedNumberOfItems);
  });
  it("matches values in /data response", function() {
    var index;
    var color;
    var value;
    for (index = 0; index < this.chartData.length; index++) {
      color = this.chartData[index].label.toLowerCase();
      value = this.chartData[index].value;
      expect(this.colorCounts[color]).to.equal(value);
    }
  });
});
