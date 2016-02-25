exports.configurator = function (event, context, config, configurationItem) {
    this.event = event;
    this.context = context;
    this.config = config;
    this.configurationItem = configurationItem;

    this.setConfig = function (compliance) {
        var putEvaluationsRequest = {};
        var ctx = this.context;
        putEvaluationsRequest.Evaluations = [
            {
                ComplianceResourceType: this.configurationItem.resourceType,
                ComplianceResourceId: this.configurationItem.resourceId,
                ComplianceType: compliance,
                OrderingTimestamp: this.configurationItem.configurationItemCaptureTime
            }
        ];
        putEvaluationsRequest.ResultToken = this.event.resultToken;
        this.config.putEvaluations(putEvaluationsRequest, function (err, data) {
            if (err) {
                ctx.fail(err);
            } else {
                ctx.succeed(data);
            }
        });
    }
};
