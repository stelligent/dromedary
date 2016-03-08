'use strict';

var express = require('express');
var app = express();
var CS = require(__dirname + '/lib/inMemoryStorage.js');
var sha = require(__dirname + '/lib/sha.js');
var reqThrottle = require(__dirname + '/lib/requestThrottle.js');
var DDBP = require(__dirname + '/lib/dynamoDbPersist.js');
var serverPort = 8080;
var siteChartStore = {};
var ddbLastFetch = {};

module.exports = app;

var ddbPersist = new DDBP();

if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
  serverPort = 0;
}

/* Helper to refresh in memory store w/ data from DDB */
function updateColorCountsFromDdb(siteName, cb) {
  var chartData = siteChartStore[siteName];

  /*jshint -W101 */
  ddbPersist.getSiteCounts(siteName, chartData.getAllCounts(), function(err, data) {
    if (err) {
      cb(err);
    } else {
      chartData.setCounts(data);
      ddbLastFetch[siteName] = Date.now();
      cb(null, chartData);
    }
  });
  /*jshint +W101 */
}

/* Returns in memory store chart data store */
function getChartData(siteName, nocache, cb) {
  if (!siteChartStore.hasOwnProperty(siteName)) {
    siteChartStore[siteName] = new CS(siteName);
    ddbLastFetch[siteName] = 0;
  }

  if (nocache || (Date.now() - ddbLastFetch[siteName] > 1000)) {
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

/* helper to determine client ip */
function getClientIp(req) {
  var ip = req.ip;
  if (req.headers.hasOwnProperty('x-real-ip')) {
    ip = req.headers['x-real-ip'];
  }
  return ip;
}

/* clean up throttle map every minute to keep it tidy */
setInterval(reqThrottle.gcMap, 1000);

/* Host static content from /public */
app.use(express.static(__dirname + '/public'));

/* GET requests to /config.json means the site is being served from /public */
app.get('/config.json', function (req, res) {
  console.log('Request received from %s for /config.json', getClientIp(req));

  sha(function(version) {
    sendJsonResponse(res, { apiBaseurl: '', version: version });
  });
});


/* GET requests to /data return chart data values */
app.get('/data', function (req, res) {
  console.log('Request received from %s for /data', getClientIp(req));
  var nocache = req.query.hasOwnProperty('nocache') ;
  getChartData(req.headers.host,nocache,function (err, data) {
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
  var ip = getClientIp(req);
  if (! reqThrottle.checkIp(ip) ) {
    console.log('Request throttled from %s for /increment', ip);
    sendJsonResponse(res, {error: 'Request throttled'});
    return;
  }

  if (!req.query.hasOwnProperty('color')) {
    console.log('No color specified in params');
    sendJsonResponse(res, {count: 0});
    return;
  }

  var nocache = req.query.hasOwnProperty('nocache') ;
  getChartData(req.headers.host,nocache,function (err, data) {
    console.log('Request received from %s for /increment', ip);
    reqThrottle.logIp(ip);
    if (err) {
      console.log(err);
      sendJsonResponse(res, {error: err});
      return;
    }
    if (! data.colorExists(req.query.color)) {
      console.log('Increment received for unknown color ' + req.query.color);
      sendJsonResponse(res, {error: 'Unknown color'});
      return;
    }

    /*jshint -W101 */
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
    /*jshint +W101 */
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
