'use strict';

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
  AWS.config.accessKeyId = 'AKIAIOSFODNN7EXAMPLE';
  AWS.config.secretAccessKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
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
      ddb = new AWS.DynamoDB({
        endpoint: new AWS.Endpoint('http://localhost:8079')
      });
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
      ConsistentRead: true,
    };

    for (getColor in colorCounts) {
      if (colorCounts.hasOwnProperty(getColor)) {
        // Ignore camelCase because of DDB Table Definition
        /*jshint -W106 */
        batchGetReqItems[ddbTableName].Keys.push({
          site_name: { S: siteName},
          color_name: { S: getColor }
        });
        /*jshint +W106 */
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
        return;
      }
      batchGetResp = data.Responses[ddbTableName];
      for (i=0; i < batchGetResp.length; i++) {
        /*jshint -W106 */
        ddbColorCounts[batchGetResp[i].color_name.S] =
          parseInt(batchGetResp[i].color_count.N);
        /*jshint +W106 */
      }

      // merge DDB & local values
      for (color in colorCounts) {
        if (colorCounts.hasOwnProperty(color)) {
          // if DDB had a value, update the local value
          if (ddbColorCounts.hasOwnProperty(color)) {
            colorCounts[color] = ddbColorCounts[color];
          // if DDB did not have a value, push an update
          } else {
            /*jshint -W106 */
            ddbBatchWrites.push({PutRequest: {Item: {
              site_name: {S: siteName},
              color_name: {S: color},
              color_count: {N: colorCounts[color].toString()}
            }}});
            /*jshint +W106 */
          }
        }
      }

      if (ddbBatchWrites.length === 0) {
        cb(null, colorCounts);
        return;
      }
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
    });
  };

  /* Increments color for specified site */
  this.incrementCount = function(siteName, colorName, cb) {
    /*jshint -W106 */
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
    /*jshint +W106 */
    ddb.updateItem(updateParams, function(err, data) {
      if (err) {
        cb(err);
      }
      console.log(colorName + ' incremented in DDB for ' + siteName);
      cb(null, data);
    });
  };
}

module.exports = Constructor;
