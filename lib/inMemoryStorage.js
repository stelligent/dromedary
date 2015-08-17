var Module = (function () {

  var chartData = {
    values: {
      red: {
        label: "Red",
        value: 20,
        color:"#AA0000",
        highlight: "#FF5A5A"
      },
      green: {
        label: "Green",
        value: 5,
        color: "#00AA00",
        highlight: "#5AFF5A"
      },
      blue: {
        label: "Blue",
        value: 10,
        color: "#0000AA",
        highlight: "#5A5AFF"
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
