'use strict';

function Constructor() {

  var chartData = {
    values: {
      charcoal: {
        label: 'Charcoal',
        value: 10,
        color:'#3A3A3A',
        highlight: '#6F6F6F'
      },
      green: {
        label: 'Green',
        value: 10,
        color: '#96AC3B',
        highlight: '#C9DF6E'
      },
      orange: {
        label: 'Orange',
        value: 10,
        color:'#F5842B',
        highlight: '#FFB75E'
      },
      purple: {
        label: 'Purple',
        value: 10,
        color: '#923F98',
        highlight: '#C572CB'
      },

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
