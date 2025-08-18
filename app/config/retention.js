const Joi = require('joi')

const defaultRetentionInterval = 14 * 24 * 60 * 60 * 1000

const schema = Joi.object({
  retentionInterval: Joi.number().default(defaultRetentionInterval)
})

const config = {
  retentionInterval: process.env.RETENTION_INTERVAL
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The retention config is invalid. ${result.error.message}`)
}

const value = result.value

module.exports = value
