var Module = (function () {

  var chartData = {
    values: {
      charcoal: {
        label: "Charcoal",
        value: 5,
        color:"#3A3A3A",
        highlight: "#6F6F6F"
      },
      green: {
        label: "Green",
        value: 9,
        color: "#96AC3B",
        highlight: "#C9DF6E"
      },
      purple: {
        label: "Purple",
        value: 15,
        color: "#923F98",
        highlight: "#C572CB"
//      },
//      orange: {
//        label: "Orange",
//        value: 11,
//        color:"#F5842B",
//        highlight: "#FFB75E"
//      },
//      pink: {
//        label: "Pink",
//        value: 12,
//        color:"#ff1493",
//        highlight: "#FFB75E"
      }
    }
  };

  chartData.getForChartJs = function () {
    var returnList = [];
    var k;
    for (k in chartData.values) {
      if (chartData.values.hasOwnProperty(k)) {
        returnList.push(chartData.values[k]);
      }
    }
    return returnList;
  };

  chartData.getAllCounts = function() {
    var allCounts = {};
    var k;
    for (k in chartData.values) {
      if (chartData.values.hasOwnProperty(k)) {
        allCounts[k] = chartData.values[k].value;
      }
    }
    return allCounts;
  };

  chartData.getCount = function(color) {
    if (chartData.values.hasOwnProperty(color)) {
      return chartData.values[color].value;
    }
    return -1;
  };

  chartData.incrementCount = function(color) {
    if (chartData.values.hasOwnProperty(color)) {
      chartData.values[color].value++;
    }
  };
  
  return chartData;
}());

module.exports = Module;
