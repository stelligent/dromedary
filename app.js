var express = require('express');
var app = express();
var CS = require(__dirname + '/lib/inMemoryStorage.js');
var commitSha = require(__dirname + '/lib/sha.js');
var reqThrottle = require(__dirname + '/lib/requestThrottle.js');
var DDBP = require(__dirname + '/lib/dynamoDbPersist.js');
var serverPort = 8080;
var siteChartStore = {};
var ddbLastFetch = {};

var ddbPersist = new DDBP();

if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
  serverPort = 0;
}

function getChartData(siteName, cb) {
  var chartData;
  if (!siteChartStore.hasOwnProperty(siteName)) {
    siteChartStore[siteName] = new CS(siteName);
    ddbLastFetch[siteName] = 0;
  }
  chartData = siteChartStore[siteName];

  // Fetch from DDB if it's been more than a second since last refresh
  if (ddbLastFetch[siteName] - Date.now() > 1000) {
    ddbPersist.getSiteCounts(siteName, chartData.getAllCounts(), function(err, data) {
      if (err) {
        cb(err);
      } else {
        chartData.setCounts(data);
        cb(null, chartData);
      }
    });
  } else {
    cb(null, chartData);
  }
}

function sendJsonResponse(res, obj) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(JSON.stringify(obj));
}

/* clean up throttle map every minute to keep it tidy */
setInterval(reqThrottle.gcMap, 1000);

/* Host static content from /public */
app.use(express.static(__dirname + '/public'));

/* GET requests to /sha returns git commit sha */
app.get('/sha', function (req, res) {
  console.log('Request received from %s for /sha', req.ip);
  sendJsonResponse(res, {sha: commitSha});
});

/* GET requests to /data return chart data values */
app.get('/data', function (req, res) {
  console.log('Request received from %s for /data', req.ip);
  getChartData(req.headers.host, function (err, data) {
    var chartData = data;
    if (err) {
      console.log(err);
      sendJsonResponse(res, {error: err});
    } else {
      if (req.query.hasOwnProperty('countsOnly')) {
        sendJsonResponse(res, chartData.getAllCounts());
      } else {
        sendJsonResponse(res, chartData.getForChartJs());
      }
    }
  });
});

/* GET requests to /increment to increment counts */
app.get('/increment', function (req, res) {
  if (! reqThrottle.checkIp(req.ip) ) {
    console.log('Request throttled from %s for /increment', req.ip);
    sendJsonResponse(res, {error: 'Request throttled'});
    return;
  }

  getChartData(req.headers.host, function (err, data) {
    var chartData = data;
    var colorCount = 0;
    console.log('Request received from %s for /increment', req.ip);
    reqThrottle.logIp(req.ip);
    if (err) {
      console.log(err);
      sendJsonResponse(res, {error: err});
      return;
    }
    if (!req.query.hasOwnProperty('color')) {
      console.log('No color specified in params');
    } else {
      console.log('Incrementing count for ' + req.query.color);
      chartData.incrementCount(req.query.color);
      colorCount = chartData.getCount(req.query.color);
    }
    sendJsonResponse(res, {count: colorCount});
  });
});

ddbPersist.init(function(err) {
  var server;
  if (err) {
    console.log('Failed to init DynamoDB persistence');
    console.log(err);
    process.exit(1);
  }

  server = app.listen(serverPort, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening on %s:%s', host, port);
    if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
      require('fs').writeFileSync(__dirname + '/dev-lib/targetPort.js',
                                  'module.exports = ' + port + ';\n');
    }
  });
});
