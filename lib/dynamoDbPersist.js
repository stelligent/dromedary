var AWS = require('aws-sdk');

// if we're running locally, use these params to create the DDB-local table
var createLocalDdbTableParams = {
  AttributeDefinitions: [
    { AttributeName: 'site_name', AttributeType: 'S' },
    { AttributeName: 'color_name', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'site_name', KeyType: 'HASH' },
    { AttributeName: 'color_name', KeyType: 'RANGE' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 5
  }
};

// setup AWS config
if (process.env.hasOwnProperty('AWS_DEFAULT_REGION')) {
  AWS.config.region = process.env.AWS_DEFAULT_REGION;
} else { 
  AWS.config.region = 'us-east-1';
}

function Constructor() {
  var ddbTableName;
  var ddb;

  this.init = function (cb) {
    // if DROMEDARY_DDB_TABLE_NAME is specified in the environment,
    // assume we're running in EC2
    if (process.env.hasOwnProperty('DROMEDARY_DDB_TABLE_NAME')) {
      ddbTableName = process.env.DROMEDARY_DDB_TABLE_NAME;
      ddb = new AWS.DynamoDB();
      ddb.waitFor('tableExists', { TableName: ddbTableName }, cb);
    } else {
      // if DROMEDARY_DDB_TABLE_NAME is not set, assume we're running in dev
      ddbTableName = 'dromedary_dev';
      ddb = new AWS.DynamoDB({ endpoint: new AWS.Endpoint('http://localhost:8079') });
      ddb.describeTable({ TableName: ddbTableName }, function(err, data) {
        if (err) {
          if (err.code === 'ResourceNotFoundException') {
            createLocalDdbTableParams.TableName = ddbTableName;
            ddb.createTable(createLocalDdbTableParams, function(err) {
              if (err) {
                cb(err, null);
              } else {
                ddb.waitFor('tableExists', { TableName: ddbTableName }, cb);
              }
            });
          } else {
            cb(err, null);
          }
        } else {
          cb(null, data);
        }
      });
    }

  };

  /* Fetches color counts from DDB; Also updates DDB if counts are missing */
  this.getSiteCounts = function(siteName, colorCounts, cb) {
    var getColor;
    var batchGetReqItems = {};

    console.log('Fetching color counts for ' + siteName);

    batchGetReqItems[ddbTableName] = {
      Keys: [],
      AttributesToGet: [ 'color_name', 'color_count' ],
      ConsistentRead: false,
    };

    for (getColor in colorCounts) {
      if (colorCounts.hasOwnProperty(getColor)) {
        batchGetReqItems[ddbTableName].Keys.push({
          site_name: { S: siteName},
          color_name: { S: getColor }
        });
      }
    }

    ddb.batchGetItem({ RequestItems: batchGetReqItems }, function(err, data) {
      var batchGetResp;
      var ddbColorCounts = {};
      var i;
      var color;
      var batchWriteParams = { RequestItems: {} };
      var ddbBatchWrites = [];
      if (err) {
        cb(err);
      }
      batchGetResp = data.Responses[ddbTableName];
      for (i=0; i < batchGetResp.length; i++) {
        ddbColorCounts[batchGetResp[i].color_name.S] = batchGetResp[i].color_count.N;
      }

      // merge DDB & local values
      for (color in colorCounts) {
        if (colorCounts.hasOwnProperty(color)) {
          // if DDB had a value, update the local value
          if (ddbColorCounts.hasOwnProperty(color)) {
            colorCounts[color] = ddbColorCounts[color];
          // if DDB did not have a value, push an update
          } else {
            ddbBatchWrites.push({PutRequest: {Item: {
              site_name: {S: siteName},
              color_name: {S: color},
              color_count: {N: colorCounts[color].toString()}
            }}});
          }
        }
      }

      if (ddbBatchWrites.length === 0) {
        cb(null, colorCounts);
      } else {
        batchWriteParams.RequestItems[ddbTableName] = ddbBatchWrites;
        console.log(JSON.stringify(batchWriteParams));
        ddb.batchWriteItem(batchWriteParams, function(err, data) {
          if (err) {
            cb(err);
          } else {
            console.log('Performed batch DDB write: ' + JSON.stringify(data));
            cb(null, colorCounts);
          }
        });
      }
    });
  };

  /* Increments color for specified site */
  this.incrementCount = function(siteName, colorName, cb) {
    var updateParams = {
      TableName: ddbTableName,
      Key: {
        site_name: { S: siteName},
        color_name: { S: colorName }
      },
      AttributeUpdates: {
        color_count: { Action: 'ADD', Value: { N: '1' } }
      }
    };
    ddb.updateItem(updateParams, function(err, data) {
      if (err) {
        cb(err);
      }
      console.log(colorName + ' incremented in DDB for ' + siteName);
      cb(null, data);
    });
  };
}

 /*
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
*/

module.exports = Constructor;





/*
var AWS = require('aws-sdk');

// setup AWS config
if (process.env.hasOwnProperty('AWS_DEFAULT_REGION')) {
  AWS.config.region = process.env.AWS_DEFAULT_REGION;
} else { 
  AWS.config.region = 'us-east-1';
}

// move to gulpfile?
process.env.DROMEDARY_DDB_TABLE_NAME = 'dromedary_dev';
process.env.DROMEDARY_DEV = 'true';

var ddbTableName = process.env.DROMEDARY_DDB_TABLE_NAME;
var ddb;
var readCap = 10;
var writeCap = 5;

var error, r;
var colors = ['charcoal', 'green', 'orange'];

if (process.env.hasOwnProperty('DROMEDARY_DEV')) {
  ddb = new AWS.DynamoDB({ endpoint: new AWS.Endpoint('http://localhost:8079') });
} else {
  ddb = new AWS.DynamoDB();
}

if (process.env.hasOwnProperty('DROMEDARY_DDB_READ_UNITS')) {
  readCap = process.env.DROMEDARY_DDB_READ_UNITS;
}
if (process.env.hasOwnProperty('DROMEDARY_DDB_WRITE_UNITS')) {
  writeCap = process.env.DROMEDARY_DDB_WRITE_UNITS;
}


function tempHandler(err, data) {
  if (err) {
    console.log(err, err.stack);
    error = err;
    r = undefined;
  } else {
    console.log('Success\n' + data);
    error = undefined;
    r = data;
  }
}

ddb.deleteTable({ TableName: ddbTableName }, tempHandler);

var createParams = {
  TableName: ddbTableName,
  AttributeDefinitions: [
    { AttributeName: 'site_name', AttributeType: 'S' },
    { AttributeName: 'color_name', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'site_name', KeyType: 'HASH' },
    { AttributeName: 'color_name', KeyType: 'RANGE' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 5
  }
};
ddb.createTable(createParams, tempHandler);

ddb.waitFor('tableExists', { TableName: ddbTableName }, tempHandler);

ddb.describeTable({ TableName: ddbTableName }, tempHandler);

var batchGetReqItems = {};
batchGetReqItems[ddbTableName] = {
  Keys: [],
  AttributesToGet: [ 'color_name', 'color_count' ],
  ConsistentRead: false,
};
for (var k in colors) {
  batchGetReqItems[ddbTableName].Keys.push({
    site_name: { S: 'localhost'},
    color_name: { S: colors[k] }
  });
}
ddb.batchGetItem({ RequestItems: batchGetReqItems }, tempHandler);

var getParams = {
  TableName: ddbTableName,
  Key: {
    site_name: { S: 'localhost' },
    color_name: { S: 'green' }
  },
  AttributesToGet: [ 'color_name', 'color_count' ],
};
ddb.getItem(getParams, tempHandler);

var putParams = {
  TableName: ddbTableName,
  Item: {
    site_name: { S: 'localhost' },
    color_name: { S: colors[0] },
    color_count: { N: '0' }
  },
  ConditionExpression: 'attribute_not_exists(color)',
};
ddb.putItem(putParams, tempHandler);

*/
