var checkDefined = function(reference, referenceName) {
  if (!reference) {
    console.log('Error: ' + referenceName + ' is not defined');
    throw referenceName;
  }
  return reference;
}
var isApplicable = function(configurationItem, event) {
  checkDefined(configurationItem, 'configurationItem');
  checkDefined(event, 'event');
  var status = configurationItem.configurationItemStatus;
  var eventLeftScope = event.eventLeftScope;
  return ('OK' === status || 'ResourceDiscovered' === status) && false === eventLeftScope;
}

exports.evaluate = function(event, context, evalFunction){
  event = checkDefined(event, 'event');
  var invokingEvent = JSON.parse(event.invokingEvent);
  var configurationItem = checkDefined(invokingEvent.configurationItem, 'invokingEvent.configurationItem');
  var compliance = 'NOT_APPLICABLE';

  if (isApplicable(invokingEvent.configurationItem, event)) {
    compliance = 'NOT_APPLICABLE';

    evalFunction(event, context, configurationItem);
  }
}
