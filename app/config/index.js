const Joi = require('joi')
const mqConfig = require('./mq-config')
const dbConfig = require('./db-config')

// Define config schema
const schema = Joi.object({
  port: Joi.number().default(3008),
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  paymentProcessingInterval: Joi.number().default(1000),
  processingCap: Joi.number().default(500),
  paymentRequestPublishingInterval: Joi.number().default(5000),
  useManualLedgerCheck: Joi.boolean().default(false)
})

// Build config
const config = {
  env: process.env.NODE_ENV,
  paymentProcessingInterval: process.env.PROCESSING_INTERVAL,
  processingCap: process.env.PROCESSING_CAP,
  paymentRequestPublishingInterval: process.env.PAYMENT_PUBLISHING_INTERVAL,
  useManualLedgerCheck: process.env.USE_MANUAL_LEDGER_CHECK
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the Joi validated value
const value = result.value

// Add some helper props
value.isDev = value.env === 'development'
value.isProd = value.env === 'production'
value.processingSubscription = mqConfig.processingSubscription
value.acknowledgementSubscription = mqConfig.acknowledgementSubscription
value.returnSubscription = mqConfig.returnSubscription
value.submitTopic = mqConfig.submitTopic
value.debtTopic = mqConfig.debtTopic
value.qcSubscription = mqConfig.qcSubscription
value.manualTopic = mqConfig.manualTopic
value.qcManualTopic = mqConfig.qcManualTopic
value.qcManualSubscription = mqConfig.qcManualSubscription
value.dbConfig = dbConfig

module.exports = value
