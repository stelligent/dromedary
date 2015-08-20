function chartHandler () {
  var ctx = document.getElementById("myChart").getContext("2d");
  var myPieChart;
  var commitSha = "unknown";
  var updateChart = false;
  var reloadPage = false;
  var lastApiHtml = '\n';

  function updateLastApi(url, xhr) {
    var urlHtml = '<p><strong>' + location.protocol + "//" + location.host + url + '</span></strong></p>\n';
    var responseHtml = '<pre style="white-space: pre-wrap;">' + xhr.getAllResponseHeaders() + '\n' + xhr.responseText + '</pre>\n';

    lastApiHtml = urlHtml + responseHtml + lastApiHtml;
    document.getElementById("lastApiResponses").innerHTML = lastApiHtml;
  }

  $.getJSON("/sha", {}, function(data, status, xhr) {
    commitSha = data.sha;
    document.getElementById("gitCommitSha").innerHTML = commitSha;
    updateLastApi("/sha", xhr);
  });

  $.getJSON("/data", {}, function(data, status, xhr) {
    myPieChart = new Chart(ctx).Pie(data);
    console.log('Chart data GET status: ' + status);
    updateLastApi("/data", xhr);
  });

  $("#myChart").click(function(evt) {
    var activePoints = myPieChart.getSegmentsAtEvent(evt);
    var colorToInc = activePoints[0].label.toLowerCase();
    $.getJSON("/increment?color=" + colorToInc, {}, function(data, status, xhr) {
      activePoints[0].value = data.count;
      console.log('Color increment GET status: ' + status);
      updateLastApi("/increment?color=" + colorToInc, xhr);
      updateChart = true;
    });
  });

  function pollForUpdates() {
    if (!myPieChart.hasOwnProperty("segments")) {
      return;
    }
    $.getJSON("/data?countsOnly=true", {}, function(data, status, xhr) {
      var segment;
      var segmentIndex;
      var color;
      var doUpdate = false;


      for (segmentIndex in myPieChart.segments) {
        segment = myPieChart.segments[segmentIndex];
        color = segment.label.toLowerCase();
        if (data.hasOwnProperty(color) && segment.value != data[color]) {
          console.log('Updating count for ' + color + ' to ' + data[color]);
          myPieChart.segments[segmentIndex].value = data[color];
          doUpdate = true;
        }
      }
      if (doUpdate) {
        updateLastApi("/data?countsOnly=true", xhr);
        updateChart = true;
      }
    });
  }
  setInterval(pollForUpdates, 5000);

  function pollForNewSha() {
    $.getJSON("/sha", {}, function(data, status, xhr) {
      if (commitSha != data.sha) {
        reloadPage = true;
      }
    });
  };
  setInterval(pollForNewSha, 1000);

  setInterval(function() {
    if (updateChart) {
      myPieChart.update();
      updateChart = false;
    }
    if (reloadPage) {
      location.reload(true);
    }
  }, 100);
}
