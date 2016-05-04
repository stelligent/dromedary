'use strict';

function Constructor() {

  var chartData = {
    values: {
      darkblue: {
        label: 'DarkBlue',
        value: 10,
        color:'#000066',
        highlight: '#6F6F6F'
      },
      red: {
        label: 'Red',
        value: 10,
        color: '#CC0000',
        highlight: '#C9DF6E'
      },
      yellow: {
        label: 'Yellow',
        value: 10,
        color:'#FF9900',
        highlight: '#FFB75E'
      }
    }
  };

  this.getForChartJs = function () {
    var returnList = [];
    var k;
    for (k in chartData.values) {
      if (chartData.values.hasOwnProperty(k)) {
        returnList.push(chartData.values[k]);
      }
    }
    return returnList;
  };

  this.getAllCounts = function() {
    var allCounts = {};
    var k;
    for (k in chartData.values) {
      if (chartData.values.hasOwnProperty(k)) {
        allCounts[k] = chartData.values[k].value;
      }
    }
    return allCounts;
  };

  this.getCount = function(color) {
    if (chartData.values.hasOwnProperty(color)) {
      return chartData.values[color].value;
    }
    return -1;
  };

  this.incrementCount = function(color) {
    if (chartData.values.hasOwnProperty(color)) {
      chartData.values[color].value++;
    }
  };

  this.setCounts = function(counts) {
    var k;
    for (k in counts) {
      if (counts.hasOwnProperty(k) && chartData.values.hasOwnProperty(k)) {
        chartData.values[k].value = counts[k];
      }
    }
  };

  this.colorExists = function(color) {
    return chartData.values.hasOwnProperty(color);
  };
}

module.exports = Constructor;
