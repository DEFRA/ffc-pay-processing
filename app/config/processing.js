const Joi = require('joi')

const schema = Joi.object({
  active: Joi.boolean().default(true),
  paymentProcessingInterval: Joi.number().default(1000),
  processingCap: Joi.number().default(5000),
  paymentRequestPublishingInterval: Joi.number().default(1000),
  useManualLedgerCheck: Joi.boolean().default(false),
  autoHold: Joi.object({
    topUp: Joi.boolean().default(false),
    recovery: Joi.boolean().default(false)
  }),
  handleSchemeClosures: Joi.boolean().default(true)
})

const config = {
  active: process.env.PROCESSING_ACTIVE,
  paymentProcessingInterval: process.env.PROCESSING_INTERVAL,
  processingCap: process.env.PROCESSING_CAP,
  paymentRequestPublishingInterval: process.env.PAYMENT_PUBLISHING_INTERVAL,
  useManualLedgerCheck: process.env.USE_MANUAL_LEDGER_CHECK,
  autoHold: {
    topUp: process.env.AUTO_HOLD_TOP_UP,
    recovery: process.env.AUTO_HOLD_RECOVERY
  },
  handleSchemeClosures: process.env.HANDLE_SCHEME_CLOSURES
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = result.value

value.isDev = value.env === 'development'
value.isProd = value.env === 'production'

module.exports = value
