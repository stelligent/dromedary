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

/* Helper to refresh in memory store w/ data from DDB */
function updateColorCountsFromDdb(siteName, cb) {
  var chartData = siteChartStore[siteName];

  ddbPersist.getSiteCounts(siteName, chartData.getAllCounts(), function(err, data) {
    if (err) {
      cb(err);
    } else {
      chartData.setCounts(data);
      ddbLastFetch[siteName] = Date.now();
      cb(null, chartData);
    }
  });
}

/* Returns in memory store (refreshed with DDB data no more often than every second) */
function getChartData(siteName, cb) {
  if (!siteChartStore.hasOwnProperty(siteName)) {
    siteChartStore[siteName] = new CS(siteName);
    ddbLastFetch[siteName] = 0;
  }

  if (Date.now() - ddbLastFetch[siteName] > 1000) {
    // Fetch from DDB if it's been more than a second since last refresh
    updateColorCountsFromDdb(siteName, cb);
  } else {
    cb(null, siteChartStore[siteName]);
  }
}

/* Helper to send responses to frontend */
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

  if (!req.query.hasOwnProperty('color')) {
    console.log('No color specified in params');
    sendJsonResponse(res, {count: 0});
    return;
  }

  getChartData(req.headers.host, function (err) {
    console.log('Request received from %s for /increment', req.ip);
    reqThrottle.logIp(req.ip);
    if (err) {
      console.log(err);
      sendJsonResponse(res, {error: err});
      return;
    }

    ddbPersist.incrementCount(req.headers.host, req.query.color, function (err) {
      console.log('Incrementing count for ' + req.query.color);
      if (err) {
        console.log(err);
        sendJsonResponse( res, {error: 'Failed to increment color count in DDB'});
        return;
      }

      updateColorCountsFromDdb(req.headers.host, function (err, data) {
        if (err) {
          console.log(err);
          sendJsonResponse( res, {error: 'Failed to increment color count in DDB'});
          return;
        }
        sendJsonResponse(res, {count: data.getCount(req.query.color)});
      });
    });
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
