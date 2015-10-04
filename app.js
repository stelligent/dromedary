var express = require('express');
var app = express();
var CS = require(__dirname + '/lib/inMemoryStorage.js');
var commitSha = require(__dirname + '/lib/sha.js');
var reqThrottle = require(__dirname + '/lib/requestThrottle.js');
var DDBP = require(__dirname + '/lib/dynamoDbPersist.js');
var serverPort = 8080;
var siteChartStore = {};

var ddbPersist = new DDBP();

if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
  serverPort = 0;
}

function getChartData(site_name) {
  if (!siteChartStore.hasOwnProperty(site_name)) {
    siteChartStore[site_name] = new CS(site_name);
  }

  return siteChartStore[site_name];
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
  var chartData = getChartData(req.headers.host);
  console.log('Request received from %s for /data', req.ip);
  if (req.query.hasOwnProperty('countsOnly')) {
    sendJsonResponse(res, chartData.getAllCounts());
  } else {
    sendJsonResponse(res, chartData.getForChartJs());
  }
});

/* GET requests to /increment to increment counts */
app.get('/increment', function (req, res) {
  var colorCount = 0;
  var chartData = getChartData(req.headers.host);
  if (! reqThrottle.checkIp(req.ip) ) {
    console.log('Request throttled from %s for /increment', req.ip);
    sendJsonResponse(res, {error: 'Request throttled'});
    return;
  }

  console.log('Request received from %s for /increment', req.ip);
  reqThrottle.logIp(req.ip);
  if (!req.query.hasOwnProperty('color')) {
    console.log('No color specified in params');
  } else {
    console.log('Incrementing count for ' + req.query.color);
    chartData.incrementCount(req.query.color);
    colorCount = chartData.getCount(req.query.color);
  }

  sendJsonResponse(res, {count: colorCount});
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
