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
      //var checkCompliance = checkCompliance;
      iam.listMFADevices(params, function(err,data){
        if (err){
          responseData = { Error: 'listMFADevices call failed'};
          console.log(responseData.Error + ':\\n', err);
        } else {
          compliance = checkCompliance(data.MFADevices);
          configLib.setConfig(event, context, config, configurationItem, compliance);
        }

      });
    }
  }
}
