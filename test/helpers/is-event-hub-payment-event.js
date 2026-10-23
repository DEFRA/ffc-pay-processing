const Joi = require('joi')

// mirrors ffc-pay-event-hub app/inbound/schemas/payment.js, which decides whether a warning is also saved against the payment
const paymentSchema = Joi.object({
  frn: Joi.number().integer().positive().optional().allow('', null),
  sbi: Joi.number().integer().positive().optional().allow('', null),
  trader: Joi.string().optional().allow('', null),
  vendor: Joi.string().optional().allow('', null),
  correlationId: Joi.string().guid().required(),
  schemeId: Joi.number().integer().positive().required(),
  invoiceNumber: Joi.string().required()
}).custom((value, helpers) => {
  const { frn, sbi, trader, vendor } = value

  if (!frn && !sbi && !trader && !vendor) {
    return helpers.error('any.custom', { message: 'No customer identifier has been provided' })
  }

  return value
})

const isEventHubPaymentEvent = (event) => {
  if (!event?.data?.frn) {
    return false
  }
  const { error } = paymentSchema.validate(event.data, { abortEarly: false, allowUnknown: true })
  return !error
}

module.exports = {
  isEventHubPaymentEvent
}
