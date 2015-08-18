var AWS         = require('aws-sdk');

// setup AWS config
if (process.env.hasOwnProperty('AWS_DEFAULT_REGION')) {
  AWS.config.region = process.env.AWS_DEFAULT_REGION;
} else {
  AWS.config.region = 'us-east-1';
}

var Module = (function () {
  var ec2 = new AWS.EC2();
  var moduleObj = {};

  function getVpcIdfromSubnet(subnetId, callback) {
    var params = { SubnetIds: [subnetId] };
    ec2.describeSubnets(params, function(err, data) {
      callback(err, data.Subnets[0].VpcId);
    });
  }

  function getDromedarySecurityGroup(vpcId, callback) {
    var params = {
      Filters: [{
        Name: 'group-name',
        Values: ['dromedary-demo-app']
      },{
        Name: 'vpc-id',
        Values: [vpcId]
      }]
    };
    ec2.describeSecurityGroups(params, function(err, data) {
      callback(err, data.SecurityGroups[0].GroupId);
    });
  }

  function createDromedarySecurityGroup(vpcId, callback) {
    var params = {
      Description: 'Dromedary - Stelligent CodePipeline Demo App',
      GroupName: 'dromedary-demo-app',
      VpcId: vpcId
    };
    ec2.createSecurityGroup(params, function(err, data) {
      if (err) {
        if (err.code === 'InvalidGroup.Duplicate') {
          getDromedarySecurityGroup(vpcId, callback);
        } else {
          callback(err, undefined);
        }
      } else {
        callback(undefined, data.GroupId);
      }
    });
  }

  function authorizeDromedaryIngress(vpcId, groupId, callback) {
    var params = {
      GroupId: groupId,
      IpProtocol: 'tcp',
      FromPort: 8080,
      ToPort: 8080,
      CidrIp: '0.0.0.0/0'
    };
    ec2.authorizeSecurityGroupIngress(params, function(err) {
      if (err) {
        if (err.code === 'InvalidPermission.Duplicate') {
          callback(undefined, {vpcId: vpcId, groupId: groupId});
        } else {
          callback(err);
        }
      } else {
        callback(undefined, {vpcId: vpcId, groupId: groupId});
      }
    });
  }

  moduleObj.ensureSecurityGroup = function (subnetId, callback) {
    getVpcIdfromSubnet(subnetId, function(err, vpcId) {
      if (err) {
        callback(err, undefined);
      } else {
        createDromedarySecurityGroup(vpcId, function(err, groupId) {
          if (err) {
            callback(err, undefined);
          } else {
            authorizeDromedaryIngress(vpcId, groupId, callback);
          }
        });
      }
    });
  };

  moduleObj.deleteAllSecurityGroups = function (callback) {

    var describeParams = {
      Filters: [{
        Name: 'group-name',
        Values: ['dromedary-demo-app']
      }]
    };
    ec2.describeSecurityGroups(describeParams, function (err, data) {
      var groupsTotal = 0;
      var groupsProcessed = 0;
      var groupsDeleted = 0;
      if (err) {
        callback(err);
      } else {
        groupsTotal = data.SecurityGroups.length;
        data.SecurityGroups.forEach(function (securityGroup) {
          var deleteParams = {GroupId: securityGroup.GroupId};
          ec2.deleteSecurityGroup(deleteParams, function(err) {
            groupsProcessed++;
            if (err) {
              callback(err);
            } else {
              groupsDeleted++;
              console.log('Delete security group ' + securityGroup.GroupId);
              if (groupsProcessed >= groupsTotal) {
                callback(undefined, groupsDeleted);
              }
            }
          });
        });
      }
    });
  };

  return moduleObj;
}());

module.exports = Module;
