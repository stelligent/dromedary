var expect    = require("chai").expect;
var chartData = require("../lib/inMemoryStorage.js");

var expectedProperties = ['value', 'color', 'highlight', 'label'];

describe("Static Data", function() {
  it("Has exactly 3 items", function() {
    expect(chartData.getForChartJs()).to.have.length(3);
  });

  it("Each item has exactly " + expectedProperties.length + " properties", function() {
    var index;
    for (index = 0; index < chartData.getForChartJs().length; index++) {
      expect(Object.keys(chartData.getForChartJs()[index])).to.have.length(expectedProperties.length);
    }
  });

  it("Each item has properties: " + expectedProperties, function() {
    var itemProperties;
    var itemIndex;
    var propIndex;
    for (itemIndex = 0; itemIndex < chartData.getForChartJs().length; itemIndex++) {
      itemProperties = Object.keys(chartData.getForChartJs()[itemIndex]);
      for (propIndex = 0; propIndex < expectedProperties.length; propIndex++) {
        expect(itemProperties).to.contain(expectedProperties[propIndex]);
      }
    }
  });
});
