const acknowledgementSchema = require('./schemas/acknowledgement')

const acknowledgePaymentRequest = require('./acknowledge-payment-request')
const getPaymentRequest = require('./get-payment-request')
const processInvalid = require('./process-invalid')

const updateAcknowledgement = async (acknowledgement) => {
  const schemaResult = acknowledgementSchema.required().validate(acknowledgement, {
    abortEarly: false,
    allowUnknown: false
  })

  if (schemaResult.error) {
    throw new Error(`The acknowledgement object is invalid, ${schemaResult.error.message}`)
  }

  acknowledgement = schemaResult.value

  await acknowledgePaymentRequest(acknowledgement.invoiceNumber, acknowledgement.acknowledged)

  if (!acknowledgement.success) {
    const { schemeId, paymentRequestId, frn } = await getPaymentRequest(acknowledgement.invoiceNumber)
    await processInvalid(schemeId, paymentRequestId, frn, acknowledgement)
  }
}

module.exports = {
  updateAcknowledgement
}
