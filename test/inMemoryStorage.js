var expect  = require("chai").expect;
var backend = require("../lib/inMemoryStorage.js");

var expectedNumberOfItems = 3;
var expectedProperties = ['value', 'color', 'highlight', 'label'];

describe("Chart Data", function() {
  beforeEach(function() {
    this.chartData = backend.getForChartJs();
  });

  it("Has exactly " + expectedNumberOfItems + " items", function() {
    expect(this.chartData).to.have.length(expectedNumberOfItems);
  });

  it("Each item has exactly " + expectedProperties.length + " properties", function() {
    var index;
    for (index = 0; index < this.chartData.length; index++) {
      expect(Object.keys(this.chartData[index])).to.have.length(expectedProperties.length);
    }
  });

  it("Each item has properties: " + expectedProperties, function() {
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

describe("Color Counts", function() {
  beforeEach(function() {
    this.colorCounts = backend.getAllCounts();
  });

  it("Has exactly " + expectedNumberOfItems + " items", function() {
    expect(Object.keys(this.colorCounts)).to.have.length(expectedNumberOfItems);
  });

  it("Each item is a number", function() {
    var color;
    for (color in this.colorCounts) {
      expect(this.colorCounts[color]).to.be.a('number');
    }
  });
})

describe("Increment Color", function() {
  beforeEach(function() {
    var color;
    for (color in this.colorCounts) {
      backend.incrementCount(color);
    }
  });

  it("Increments by one", function() {
    var color;
    for (color in this.colorCounts) {
      expect(backend.getCount(color)).to.equal(this.colorCounts[color]+1);
    }
  });
})

