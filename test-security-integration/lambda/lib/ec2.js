exports.getFunctions = function () {
    var aws = require('aws-sdk');
    var ec2 = new aws.EC2();
    var config = new aws.ConfigService();
    var configLib = require('./config');
    return {
        evaluateEC2SecurityGroup: function (event, context, configurationItem, rule) {
            var params = {
                "GroupIds": [configurationItem.resourceId]
            };
            ec2.describeSecurityGroups(params, function (err, data) {
                var responseData = {};
                var compliance = undefined;
                if (err) {
                    responseData = {Error: 'describeSecurityGroups call failed'};
                    console.log(responseData.Error + ':\\n', err);
                } else {
                    if (data.SecurityGroups.length === 0) {
                        responseData = {Error: 'Security Group not found'};
                        console.log(responseData.Error + ':\\n', err);
                    }
                    else {
                        var configurator = new configLib.configurator(event, context, config, configurationItem);
                        compliance = rule.test(data.SecurityGroups[0], configurator);
                    }
                }
            });
        }
    }
};
