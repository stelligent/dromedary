var expect  = require("chai").expect;
var backend = require("../lib/inMemoryStorage.js");

var expectedProperties = ['value', 'color', 'highlight', 'label'];

describe("Chart Data", function() {
  var chartData;
  before(function() {
    chartData = backend.getForChartJs();
  });

  it("Has exactly 3 items", function() {
    expect(chartData).to.have.length(3);
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

describe("Color Counts", function() {
  var colorCounts;
  before(function() {
    colorCounts = backend.getAllCounts();
  });

  it("Has exactly 3 items", function() {
    expect(Object.keys(colorCounts)).to.have.length(3);
  });

  it("Each item is a number", function() {
    var color;
    for (color in colorCounts) {
      expect(colorCounts[color]).to.be.a('number');
    }
  });
})

describe("Increment Color", function() {
  var colorCounts;
  before(function() {
    var color;
    for (color in colorCounts) {
      backend.incrementCount(color);
    }
  });

  it("Increments by one", function() {
    var color;
    for (color in colorCounts) {
      expect(backend.getCount(color)).to.equal(colorCounts[color]+1);
    }
  });
})

