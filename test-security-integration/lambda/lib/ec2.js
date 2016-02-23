

exports.getFunctions = function(){
  var aws = require('aws-sdk');
  var ec2 = new aws.EC2();
  var config = new aws.ConfigService();
  var configLib = require('./config');
  return {
    evaluateEC2SecurityGroup: function(event, context, configurationItem, checkCompliance){
      var params = {
        "GroupIds": [configurationItem.resourceId]
      };

      //var checkCompliance = checkCompliance;
      ec2.describeSecurityGroups(params, function(err, data){
        if (err){
          responseData = { Error: 'describeSecurityGroups call failed'};
          console.log(responseData.Error + ':\\n', err);
        } else {
          if (data.SecurityGroups.length === 0){
            responseData = { Error: 'Security Group not found'};
            console.log(responseData.Error + ':\\n', err);
          }
          else {
            //console.log(data.SecurityGroups[0].IpPermissionsEgress[0]);
            compliance = checkCompliance(data.SecurityGroups[0]);
            //console.log(compliance);
            configLib.setConfig(event, context, config, configurationItem, compliance);
          }

        }
      });
    }
  }
}

/*
exports.evaluateEC2SecurityGroup = function(event, context, configurationItem, checkCompliance){
  var params = {
    "GroupIds": [configurationItem.resourceId]
  };
  var putEvaluationsRequest = {};
  var checkCompliance = checkCompliance;
  ec2.describeSecurityGroups(params, function(err, data){
    if (err){
      responseData = { Error: 'describeSecurityGroups call failed'};
      console.log(responseData.Error + ':\\n', err);
    } else {
      if (data.SecurityGroups.length === 0){
        responseData = { Error: 'Security Group not found'};
        console.log(responseData.Error + ':\\n', err);
      }
      else {
        console.log(data.SecurityGroups[0].IpPermissions[0]);
        compliance = checkCompliance(data.SecurityGroups[0]);
        console.log(compliance);
      }
      putEvaluationsRequest.Evaluations = [
        {
          ComplianceResourceType: configurationItem.resourceType,
          ComplianceResourceId: configurationItem.resourceId,
          ComplianceType: compliance,
          OrderingTimestamp: configurationItem.configurationItemCaptureTime
        }
      ];
      putEvaluationsRequest.ResultToken = event.resultToken;
      config.putEvaluations(putEvaluationsRequest, function (err, data) {
        if (err) {
          context.fail(err);
        } else {
          context.succeed(data);
        }
      });
    }
  });
}
*/
