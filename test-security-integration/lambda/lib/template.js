
exports.defineTest = function(event, context, resourceType, resourceGroup, testCase){
  var awsLib = require('./aws');
  var resourceLib = require('./'+ resourceType.toLowerCase());
  var ruleLib = require('./rules');
  var resourceFunction = "evaluate" + resourceType + resourceGroup;
  awsLib.evaluate(event, context, function(event, context, configurationItem){
    resourceLib.getFunctions()[resourceFunction](event, context, configurationItem, ruleLib.getRules()[resourceType][testCase]);
  });
}
