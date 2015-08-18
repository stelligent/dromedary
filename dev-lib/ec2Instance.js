var AWS         = require('aws-sdk');

// setup AWS config
if (process.env.hasOwnProperty('AWS_DEFAULT_REGION')) {
  AWS.config.region = process.env.AWS_DEFAULT_REGION;
} else {
  AWS.config.region = 'us-east-1';
}

var Module = (function () {

  var ec2 = new AWS.EC2();

  var ami = {};
  ami['us-east-1'] = 'ami-1ecae776';
  ami['us-west-2'] = 'ami-e7527ed7';

  var moduleObj = {};

  var userData = '#!/bin/bash -ex\n'
               + 'yum --enablerepo=epel install -y nodejs npm\n';

  var launchParams = {
    ImageId: ami[AWS.config.region],
    MaxCount: 1,
    MinCount: 1,
    InstanceType: 't2.micro',
    UserData: Buffer(userData).toString('base64')
  };
  launchParams.KeyName = 'vrivellino-labs';
  launchParams.SecurityGroupIds = undefined;
  launchParams.SubnetId = undefined;

  function launchEc2Instance(params, callback) {
    var paramKey;

    for (paramKey in launchParams) {
      if (launchParams.hasOwnProperty(paramKey) && !params.hasOwnProperty(paramKey)) {
        params[paramKey] = launchParams[paramKey];
      }
    }
    ec2.runInstances(params, function (err, data) {
      var instanceId;
      if (err) {
        callback(err);
        return;
      }
      instanceId = data.Instances[0].InstanceId;
      console.log("Launched instance " + instanceId);

      // Add tags to the instance
      params = {
        Resources: [instanceId],
        Tags: [{Key: 'Name', Value: 'dromedary-demo-app'}]
      };
      ec2.createTags(params, function(err) {
        callback(err, instanceId);
      });
    });
  }

  function waitForEc2Instance(instanceId, callback) {
    var instanceState = 'unknown';
    var intervals = 0;
    var intervalId;

    function innerCallback(err, data) {
      if (err) {
        instanceState = 'unknown_failure';
        clearInterval(intervalId);
        callback(err);
        return;
      }
      if (++intervals >= 60) {
        console.log('Too long polling instance');
        clearInterval(intervalId);
        callback('Timeout exceeded polling for instance');
        return;
      }
      instanceState = data.Reservations[0].Instances[0].State.Name;
      console.log(instanceId + ' is ' + instanceState);
      switch (instanceState) {
        case 'pending':
          break;
        case 'running':
          clearInterval(intervalId);
          callback(undefined, data.Reservations[0].Instances[0]);
          break;
        default:
          clearInterval(intervalId);
          console.log('Unexpected instance state');
          callback('Unexpected instance state');
          break;
      }
    }

    intervalId = setInterval(function() {
      ec2.describeInstances({InstanceIds: [instanceId]}, innerCallback);
    }, 2000);
  }

  moduleObj.launchDromedaryInstance = function (params, callback) {
    launchEc2Instance(params, function(err, instanceId) {
      if (err) {
        callback(err);
      } else {
        waitForEc2Instance(instanceId, callback);
      }
    });
  };

  moduleObj.terminateAllInstances = function (callback) {
    var instanceIds = [];
    var params = {Filters: [
      {Name: 'tag:Name', Values: ['dromedary-demo-app']},
      {Name: 'instance-state-name', Values: ['running']}
    ]};
    ec2.describeInstances(params, function(err, data) {
      var i, j;
      if (err) {
        callback(err);
        return;
      }
      for (i=0; i<data.Reservations.length; i++) {
        for (j=0; j<data.Reservations[i].Instances.length; j++) {
          instanceIds.push(data.Reservations[i].Instances[j].InstanceId);
        }
      }
      if (instanceIds.length > 0) {
        console.log('Terminating instances: ' + instanceIds);
        ec2.terminateInstances({InstanceIds: instanceIds}, callback);
      }
    });
  };

  return moduleObj;
}());

module.exports = Module;
