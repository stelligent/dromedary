var expect    = require("chai").expect;
var request   = require('urllib-sync').request;

var targetUrl   = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

var expectedNumberOfItems = 3;
var expectedProperties = ['value', 'color', 'highlight', 'label'];

describe("Chart Data Response", function() {
  var chartData;
  beforeEach(function() {
    chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
  });

  it("Has exactly " + expectedNumberOfItems + " items", function() {
    expect(chartData).to.have.length(expectedNumberOfItems);
  });

  it("Each item has exactly " + expectedProperties.length + " properties", function() {
    var index;
    for (index = 0; index < chartData.length; index++) {
      expect(Object.keys(chartData[index])).to.have.length(expectedProperties.length);
    }
  });

  it("Each item has properties: " + expectedProperties, function() {
    var itemProperties;
    var itemIndex;
    var propIndex;
    for (itemIndex = 0; itemIndex < chartData.length; itemIndex++) {
      itemProperties = Object.keys(chartData[itemIndex]);
      for (propIndex = 0; propIndex < expectedProperties.length; propIndex++) {
        expect(itemProperties).to.contain(expectedProperties[propIndex]);
      }
    }
  });
});

describe("Color Counts Response", function() {
  var chartData;
  var colorCounts;
  beforeEach(function() {
    chartData = JSON.parse(request(targetUrl + '/data').data.toString('utf-8'));
    colorCounts = JSON.parse(request(targetUrl + '/data?countsOnly').data.toString('utf-8'));
  });

  it("Has exactly " + expectedNumberOfItems + " keys", function() {
    expect(Object.keys(colorCounts)).to.have.length(expectedNumberOfItems);
  });
  it("Matches values in chart data response", function() {
    var index;
    var color;
    var value;
    for (index = 0; index < chartData.length; index++) {
      color = chartData[index].label.toLowerCase();
      value = chartData[index].value;
      expect(colorCounts[color]).to.equal(value);
    }
  });
});
