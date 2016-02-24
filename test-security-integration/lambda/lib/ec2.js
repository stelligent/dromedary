

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
        var responseData = {};
        var compliance = undefined;
        if (err){
          responseData = { Error: 'describeSecurityGroups call failed'};
          console.log(responseData.Error + ':\\n', err);
        } else {
          if (data.SecurityGroups.length === 0){
            responseData = { Error: 'Security Group not found'};
            console.log(responseData.Error + ':\\n', err);
          }
          else {
            compliance = checkCompliance(data.SecurityGroups[0]);
            configLib.setConfig(event, context, config, configurationItem, compliance);
          }

        }
      });
    }
  }
}

