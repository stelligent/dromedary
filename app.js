var express = require('express');
var app = express();
var chartData = require(__dirname + '/lib/inMemoryStorage.js');

/* Host static content from /public */
app.use(express.static(__dirname + '/public'));

/* GET requests to /data return chart data values */
app.get('/data', function (req, res) {
  console.log('Request received from %s for /data', req.ip);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.query.hasOwnProperty('countsOnly')) {
    res.send(JSON.stringify(chartData.getAllCounts()));
  } else {
    res.send(JSON.stringify(chartData.getForChartJs()));
  }
});

/* GET requests to /increment to increment counts */
app.get('/increment', function (req, res) {
  var colorCount = 0;
  console.log('Request received from %s for /increment', req.ip);
  if (!req.query.hasOwnProperty('color')) {
    console.log('No color specified in params');
  } else {
    console.log('Incrementing count for ' + req.query.color);
    chartData.incrementCount(req.query.color);
    colorCount = chartData.getCount(req.query.color);
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(JSON.stringify({count: colorCount}));
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port; 
  console.log('Listening on %s:%s', host, port); 
});
