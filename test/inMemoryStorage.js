var expect    = require("chai").expect;
var InMemStor = require("../lib/inMemoryStorage.js");

var expectedNumberOfItems = 3;
var expectedProperties = ['value', 'color', 'highlight', 'label'];
var backend = new InMemStor();

describe("inMemoryStorage", function() {
  describe(".getForChartJs()", function() {
    beforeEach(function() {
      this.chartData = backend.getForChartJs();
    });

    it("has exactly " + expectedNumberOfItems + " items", function() {
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

  describe(".getAllCounts()", function() {
    beforeEach(function() {
      this.colorCounts = backend.getAllCounts();
    });

    it("has exactly " + expectedNumberOfItems + " items", function() {
      expect(Object.keys(this.colorCounts)).to.have.length(expectedNumberOfItems);
    });

    it("each item is a number", function() {
      var color;
      for (color in this.colorCounts) {
        expect(this.colorCounts[color]).to.be.a('number');
      }
    });
  });

  describe(".incrementCount()", function() {
    beforeEach(function() {
      var color;
      for (color in this.colorCounts) {
        backend.incrementCount(color);
      }
    });

    it("increments counts by one", function() {
      var color;
      for (color in this.colorCounts) {
        expect(backend.getCount(color)).to.equal(this.colorCounts[color]+1);
      }
    });
  });

  describe(".colorExists()", function() {
    beforeEach(function() {
      this.colors = Object.keys(backend.getAllCounts());
      this.badcolors = ['', 'UKNOWN', null];
    });

    it("each color exists", function() {
      var i;
      var result;
      for (i=0; i < this.colors.length; i++) {
        result = backend.colorExists(this.colors[i]);
        expect(result).to.be.true;
      }
    });

    it("bad colors do not exist", function() {
      var i;
      var result;
      for (i=0; i < this.badcolors.length; i++) {
        result = backend.colorExists(this.badcolors[i]);
        expect(result).to.be.false;
      }
    });
  });
});
