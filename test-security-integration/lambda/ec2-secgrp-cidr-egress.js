exports.handler = function(event, context){
  var template = require('./lib/template');
  template.defineTest(event, context, "EC2", "SecurityGroup", "CidrEgress");
};
