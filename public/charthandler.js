function chartHandler () {
  var ctx = document.getElementById("myChart").getContext("2d");
  var myPieChart;
  var commitSha = "unknown";
  var updateChart = false;
  var reloadPage = false;
  var lastApiHtml = '\n';
  var colorCounts = {};
  var colors = [];

  function updateLastApi(url, xhr) {
    return;
    var urlHtml = '<p><strong>' + location.protocol + "//" + location.host + url + '</span></strong></p>\n';
    var responseHtml = '<pre style="white-space: pre-wrap;">' + xhr.getAllResponseHeaders() + '\n' + xhr.responseText + '</pre>\n';

    lastApiHtml = urlHtml + responseHtml + lastApiHtml;
    document.getElementById("lastApiResponses").innerHTML = lastApiHtml;
  }

  function updateLastApiMessage(message) {
    var d = new Date();
    lastApiHtml = '<li><span class="timestamp">' + d.toDateString() + ' ' + d.toLocaleTimeString()
                + '</span> ' + message + '</li>\n' + lastApiHtml;
    document.getElementById("lastApiResponses").innerHTML = lastApiHtml;
  }

  function refreshColorCount() {
    var w = Math.floor(12 / colors.length);
    var colorCountHtml = '';
    var divClass;
    var i;
    var color;
    for (i = 0; i < colors.length; i++) {
      color = colors[i];
      divClass = 'col-sm-' + w + ' border-right';
      if (i === colors.length - 1) {
        divClass = 'col-sm-' + w;
      }
      colorCountHtml += '<div id="' + color + 'CountDiv" class="' + divClass + '"><p id="' + color + 'Count" class="totnum">'
                     + colorCounts[colors[i]].value + '</p><p id="' + color + 'CountLabel">' + colorCounts[colors[i]].label + '</p></div>\n';
    }
    document.getElementById("colorCounts").innerHTML = colorCountHtml;
  }

  function incrementColorViaColorCounts(colorToInc) {
    $.getJSON("/increment?color=" + colorToInc, {}, function(data, status, xhr) {
      var segment;
      var segmentColor;
      var segmentIndex;

      // console.log('Color increment GET status: ' + status);
      if (status !== 'success') {
        console.log('Failed to fetch /increment?color=' + colorToInc);
      } else if (data.hasOwnProperty('error')) {
        console.log('/increment error: ' + data.error);
        updateLastApiMessage('Vote for ' + colorToInc + ' failed: ' + data.error);
      } else if (data.hasOwnProperty('count') && data.count > 0) {
        updateLastApi("/increment?color=" + colorToInc, xhr);
        colorCounts[colorToInc].value = data.count;
        for (segmentIndex in myPieChart.segments) {
          segment = myPieChart.segments[segmentIndex];
          segmentColor = segment.label.toLowerCase();
          if (segmentColor === colorToInc) {
            myPieChart.segments[segmentIndex].value = data.count;
            updateChart = true;
            updateLastApiMessage('Incremented ' + colorToInc + ' ... new count is ' + data.count);
          }
        }
      }
    });
  }

  $.ajaxSetup({ timeout: 750 });

  $.getJSON("/sha", {}, function(data, status, xhr) {
    if (status !== 'success' || ! data.hasOwnProperty('sha')) {
      return;
    }
    commitSha = data.sha;
    document.getElementById("gitCommitSha").innerHTML = commitSha;
    updateLastApi("/sha", xhr);
    updateLastApiMessage('Build version is ' + commitSha);
  });

  $.getJSON("/data", {}, function(data, status, xhr) {
    var i;
    // console.log('Chart data GET status: ' + status);
    // console.log('Chart data GET: ' + JSON.stringify(data));
    if (status !== 'success') {
      console.log('Failed to fetch /data');
      return;
    }
    myPieChart = new Chart(ctx).Pie(data);
    updateLastApi("/data", xhr);
    updateLastApiMessage('Initial chart data received');

    for (i = 0; i < data.length; i++) {
      colors.push(data[i].label.toLowerCase());
      colorCounts[data[i].label.toLowerCase()] = {label: data[i].label, value: data[i].value};
    }
    refreshColorCount();
  });

  $("#colorCounts").click(function(evt) {
    var colorMatch = evt.target.id.match(/^([a-z]+)Count(Div|Label)?$/);
    if (colorMatch !== null) {
      incrementColorViaColorCounts(colorMatch[1]);
    }
  });

  $("#myChart").click(function(evt) {
    var activePoints = myPieChart.getSegmentsAtEvent(evt);
    var colorToInc = activePoints[0].label.toLowerCase();
    $.getJSON("/increment?color=" + colorToInc, {}, function(data, status, xhr) {
      console.log('Color increment GET status: ' + status);
      if (status !== 'success') {
        console.log('Failed to fetch /increment?color=' + colorToInc);
        return;
      }
      updateLastApi("/increment?color=" + colorToInc, xhr);
      if (data.hasOwnProperty('error')) {
        console.log('/increment error: ' + data.error);
        updateLastApiMessage('Vote for ' + colorToInc + ' failed: ' + data.error);
      } else if (data.hasOwnProperty('count') && data.count > 0) {
        activePoints[0].value = data.count;
        colorCounts[colorToInc].value = data.count;
        updateChart = true;
        updateLastApiMessage('Incremented ' + colorToInc + ' ... new count is ' + data.count);
      }
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

      // console.log('Chart counts GET status: ' + status);
      // console.log('Chart counts GET: ' + JSON.stringify(data));

      if (status !== 'success') {
        console.log('Failed to fetch /data?countsOnly=true');
        return;
      }

      for (segmentIndex in myPieChart.segments) {
        segment = myPieChart.segments[segmentIndex];
        color = segment.label.toLowerCase();
        if (segment.value !== data[color]) {
          console.log('Updating count for ' + color + ' to ' + data[color]);
          myPieChart.segments[segmentIndex].value = data[color];
          doUpdate = true;
        }
        colorCounts[color].value = data[color];
      }
      if (doUpdate) {
        updateLastApi("/data?countsOnly=true", xhr);
        updateLastApiMessage('New color counts received from backend');
        updateChart = true;
      }
    });
  }
  setInterval(pollForUpdates, 5000);

  function pollForNewSha() {
    $.getJSON("/sha", {}, function(data, status, xhr) {
      // console.log('Build version GET status: ' + status);
      // console.log('Build version GET: ' + JSON.stringify(data));
      if (status !== 'success' || ! data.hasOwnProperty('sha')) {
        return;
      }
      if (commitSha != data.sha) {
        reloadPage = true;
        updateLastApiMessage('New commit sha detected!');
      }
    });
  };
  setInterval(pollForNewSha, 1000);

  setInterval(function() {
    if (updateChart) {
      myPieChart.update();
      refreshColorCount();
      updateLastApiMessage('Updating chart');
      updateChart = false;
    }
    if (reloadPage) {
      location.reload(true);
    }
  }, 100);
}
