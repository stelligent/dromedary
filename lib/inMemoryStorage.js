'use strict';

function Constructor() {

  var chartData = {
    values: {
      lightgreen: {
        label: 'LightGreen',
        value: 10,
        color:'#8cdd2a',
        highlight:'#b0e76f'
      },
      darkgreen: {
        label: 'DarkGreen',
        value: 10,
        color:'#27ae1d',
        highlight:'#85ac82'
      },
      black: {
        label: 'Black',
        value: 10,
        color:'#000000',
        highlight:'#797979'
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

  this.getChartData = function() {
    return chartData;
  };
}

module.exports = Constructor;
