exports.defineTest = function (event, context, resourceType, resourceGroup, rule) {
    var awsLib = require('./aws');
    var resourceLib = require('./' + resourceType.toLowerCase());
    var ruleLib = require('./rules');
    var resourceFunction = "evaluate" + resourceType + resourceGroup;
    var rule = ruleLib.getRules()[resourceType][rule];
    awsLib.evaluate(event, context, function (event, context, configurationItem) {
        resourceLib.getFunctions()[resourceFunction](event, context, configurationItem, rule);
    });
};
