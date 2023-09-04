const Joi = require('joi')

const schema = Joi.object({
  paymentProcessingInterval: Joi.number().default(1000),
  processingCap: Joi.number().default(500),
  paymentRequestPublishingInterval: Joi.number().default(5000),
  useManualLedgerCheck: Joi.boolean().default(false),
  autoHold: Joi.object({
    topUp: Joi.boolean().default(false),
    recovery: Joi.boolean().default(false)
  }),
  useV2Events: Joi.boolean().default(true),
  handleSFIClosures: Joi.boolean().default(false)
})

const config = {
  paymentProcessingInterval: process.env.PROCESSING_INTERVAL,
  processingCap: process.env.PROCESSING_CAP,
  paymentRequestPublishingInterval: process.env.PAYMENT_PUBLISHING_INTERVAL,
  useManualLedgerCheck: process.env.USE_MANUAL_LEDGER_CHECK,
  autoHold: {
    topUp: process.env.AUTO_HOLD_TOP_UP,
    recovery: process.env.AUTO_HOLD_RECOVERY
  },
  useV2Events: process.env.USE_V2_EVENTS,
  handleSFIClosures: process.env.HANDLE_SFI_CLOSURES
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
