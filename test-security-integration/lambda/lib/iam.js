exports.getFunctions = function () {
    var aws = require('aws-sdk');
    var configLib = require('./config');
    var iam = new aws.IAM();
    var config = new aws.ConfigService();
    return {
        evaluateIAMUser: function (event, context, configurationItem, rule) {
            console.log(configurationItem.configuration);
            var params = {
                "UserName": configurationItem.configuration.userName
            };
            iam.getUser(params, function (err, data) {
                var responseData = {};
                if (err) {
                    responseData = {Error: 'getUser call failed'};
                    console.log(responseData.Error + ':\\n', err);
                } else {
                    var configurator = new configLib.configurator(event, context, config, configurationItem);
                    rule.test(data.User, configurator);
                }

            });
        },
        evaluateIAMPolicy: function (event, context, configurationItem, rule) {
            var params = {
                "PolicyArn": configurationItem.ARN
            };
            iam.getPolicy(params, function (err, data) {
                var responseData = {};
                if (err) {
                    responseData = {Error: 'getPolicy call failed'};
                    console.log(responseData.Error + ':\\n', err);
                } else {
                    var configurator = new configLib.configurator(event, context, config, configurationItem);
                    rule.test(data.Policy, configurator);
                }
            });
        }
    }
};
