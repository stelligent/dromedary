exports.handler = function(event, context){
  var template = require('./lib/template');
  template.defineTest(event, context, "IAM", "User", "MFADevice");
};
