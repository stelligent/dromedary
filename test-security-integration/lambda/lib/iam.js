exports.getFunctions = function(){
  var aws = require('aws-sdk');
  var configLib = require('./config');
  var iam = new aws.IAM();
  var config = new aws.ConfigService();
  return {
    evaluateIAMUser: function(event, context, configurationItem, checkCompliance){
      var params = {
        "UserName": configurationItem.configuration.userName
      };
      iam.getUser(params, function(err,data){
        var responseData = {};
        var compliance = undefined;
        if (err){
          responseData = { Error: 'getUser call failed'};
          console.log(responseData.Error + ':\\n', err);
        } else {
          compliance = checkCompliance(data.User);
          configLib.setConfig(event, context, config, configurationItem, compliance);
        }

      });
    },
    evaluateIAMPolicy: function(event, context, configurationItem, checkCompliance){
      var params = {
        "PolicyArn": configurationItem.ARN
      };
      iam.getPolicy(params, function(err,data){
        var responseData = {};
        var compliance = undefined;
        if (err){
          responseData = { Error: 'getPolicy call failed'};
          console.log(responseData.Error + ':\\n', err);
        } else {
          compliance = checkCompliance(data.Policy);
          configLib.setConfig(event, context, config, configurationItem, compliance);
        }

      });
    }
  }
};
