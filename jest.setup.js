jest.setTimeout(100000)

const setEnvVarIfMissing = (name, value) => {
  if (!process.env[name]) {
    process.env[name] = value
  }
}

setEnvVarIfMissing('MESSAGE_QUEUE_HOST', 'servicebus-emulator')
setEnvVarIfMissing('MESSAGE_QUEUE_USER', 'RootManageSharedAccessKey')
setEnvVarIfMissing('MESSAGE_QUEUE_PASSWORD', 'SAS_KEY_VALUE')
setEnvVarIfMissing('PROCESSING_TOPIC_ADDRESS', 'ffc-pay-processing-test')
setEnvVarIfMissing('PROCESSING_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('ACKNOWLEDGEMENT_TOPIC_ADDRESS', 'ffc-pay-acknowledgement-test')
setEnvVarIfMissing('ACKNOWLEDGEMENT_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('RETURN_TOPIC_ADDRESS', 'ffc-pay-return-test')
setEnvVarIfMissing('RETURN_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('PAYMENTSUBMIT_TOPIC_ADDRESS', 'ffc-pay-submit-test')
setEnvVarIfMissing('DEBT_TOPIC_ADDRESS', 'ffc-pay-debt-data-test')
setEnvVarIfMissing('QC_TOPIC_ADDRESS', 'ffc-pay-debt-data-response-test')
setEnvVarIfMissing('QC_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('MANUALCHECK_TOPIC_ADDRESS', 'ffc-pay-manual-check-data-test')
setEnvVarIfMissing('QCMANUALCHECK_TOPIC_ADDRESS', 'ffc-pay-quality-check-test')
setEnvVarIfMissing('QCMANUALCHECK_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('XB_TOPIC_ADDRESS', 'ffc-pay-xb-test')
setEnvVarIfMissing('XBRESPONSE_TOPIC_ADDRESS', 'ffc-pay-xb-response-test')
setEnvVarIfMissing('XBRESPONSE_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('RETENTION_TOPIC_ADDRESS', 'fcp-pds-data-retention')
setEnvVarIfMissing('RETENTION_SUBSCRIPTION_ADDRESS', 'ffc-pay-processing')
setEnvVarIfMissing('EVENTS_TOPIC_ADDRESS', 'ffc-pay-events-test')
setEnvVarIfMissing('RETURN_RESPONSE_TOPIC_ADDRESS', 'ffc-pay-return-response-test')
