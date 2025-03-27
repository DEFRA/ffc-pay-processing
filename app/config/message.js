const Joi = require('joi')

const schema = Joi.object({
  messageQueue: {
    host: Joi.string().required(),
    username: Joi.string(),
    password: Joi.string(),
    useCredentialChain: Joi.bool().default(false),
    appInsights: Joi.object(),
    managedIdentityClientId: Joi.string().optional()
  },
  processingSubscription: {
    address: Joi.string().required(),
    topic: Joi.string().required(),
    type: Joi.string().default('subscription'),
    numberOfReceivers: Joi.number().default(3)
  },
  acknowledgementSubscription: {
    address: Joi.string().required(),
    topic: Joi.string().required(),
    type: Joi.string().default('subscription')
  },
  returnSubscription: {
    address: Joi.string().required(),
    topic: Joi.string().required(),
    type: Joi.string().default('subscription')
  },
  submitTopic: {
    address: Joi.string().required()
  },
  debtTopic: {
    address: Joi.string().required()
  },
  qcSubscription: {
    address: Joi.string().required(),
    topic: Joi.string().required(),
    type: Joi.string().default('subscription')
  },
  manualTopic: {
    address: Joi.string().required()
  },
  qcManualSubscription: {
    address: Joi.string().required(),
    topic: Joi.string().required(),
    type: Joi.string().default('subscription')
  },
  xbTopic: {
    address: Joi.string().required()
  },
  xbResponseSubscription: {
    address: Joi.string().required(),
    topic: Joi.string().required(),
    type: Joi.string().default('subscription')
  },
  eventTopic: {
    address: Joi.string().required()
  },
  eventsTopic: {
    address: Joi.string().required()
  }
})
const config = {
  messageQueue: {
    host: process.env.MESSAGE_QUEUE_HOST,
    username: process.env.MESSAGE_QUEUE_USER,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === 'production',
    appInsights: process.env.NODE_ENV === 'production' ? require('applicationinsights') : undefined,
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  },
  processingSubscription: {
    address: process.env.PROCESSING_SUBSCRIPTION_ADDRESS,
    topic: process.env.PROCESSING_TOPIC_ADDRESS
  },
  acknowledgementSubscription: {
    address: process.env.ACKNOWLEDGEMENT_SUBSCRIPTION_ADDRESS,
    topic: process.env.ACKNOWLEDGEMENT_TOPIC_ADDRESS
  },
  returnSubscription: {
    address: process.env.RETURN_SUBSCRIPTION_ADDRESS,
    topic: process.env.RETURN_TOPIC_ADDRESS
  },
  submitTopic: {
    address: process.env.PAYMENTSUBMIT_TOPIC_ADDRESS
  },
  debtTopic: {
    address: process.env.DEBT_TOPIC_ADDRESS
  },
  qcSubscription: {
    address: process.env.QC_SUBSCRIPTION_ADDRESS,
    topic: process.env.QC_TOPIC_ADDRESS
  },
  manualTopic: {
    address: process.env.MANUALCHECK_TOPIC_ADDRESS
  },
  qcManualSubscription: {
    address: process.env.QCMANUALCHECK_SUBSCRIPTION_ADDRESS,
    topic: process.env.QCMANUALCHECK_TOPIC_ADDRESS
  },
  xbTopic: {
    address: process.env.XB_TOPIC_ADDRESS
  },
  xbResponseSubscription: {
    address: process.env.XBRESPONSE_SUBSCRIPTION_ADDRESS,
    topic: process.env.XBRESPONSE_TOPIC_ADDRESS
  },
  eventTopic: {
    address: process.env.EVENT_TOPIC_ADDRESS
  },
  eventsTopic: {
    address: process.env.EVENTS_TOPIC_ADDRESS
  }
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The message queue config is invalid. ${result.error.message}`)
}

const processingSubscription = { ...result.value.messageQueue, ...result.value.processingSubscription }
const acknowledgementSubscription = { ...result.value.messageQueue, ...result.value.acknowledgementSubscription }
const returnSubscription = { ...result.value.messageQueue, ...result.value.returnSubscription }
const submitTopic = { ...result.value.messageQueue, ...result.value.submitTopic }
const debtTopic = { ...result.value.messageQueue, ...result.value.debtTopic }
const qcSubscription = { ...result.value.messageQueue, ...result.value.qcSubscription }
const manualTopic = { ...result.value.messageQueue, ...result.value.manualTopic }
const qcManualSubscription = { ...result.value.messageQueue, ...result.value.qcManualSubscription }
const xbTopic = { ...result.value.messageQueue, ...result.value.xbTopic }
const xbResponseSubscription = { ...result.value.messageQueue, ...result.value.xbResponseSubscription }
const eventTopic = { ...result.value.messageQueue, ...result.value.eventTopic }
const eventsTopic = { ...result.value.messageQueue, ...result.value.eventsTopic }

module.exports = {
  processingSubscription,
  acknowledgementSubscription,
  returnSubscription,
  submitTopic,
  debtTopic,
  qcSubscription,
  manualTopic,
  qcManualSubscription,
  xbTopic,
  xbResponseSubscription,
  eventTopic,
  eventsTopic
}
