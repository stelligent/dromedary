exports.setConfig = function(event, context, config, configurationItem, compliance){
  var putEvaluationsRequest = {};
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
};
