const mqConfig = {
  host: process.env.MESSAGE_QUEUE_HOST,
  username: process.env.MESSAGE_QUEUE_USER,
  password: process.env.MESSAGE_QUEUE_PASSWORD,
  useCredentialChain: false,
  appInsights: undefined,
  type: 'subscription',
  retries: 5
}

const config = {
  processingSubscription: {
    ...mqConfig,
    address: process.env.PROCESSING_SUBSCRIPTION_ADDRESS,
    topic: process.env.PROCESSING_TOPIC_ADDRESS
  },
  submitTopic: {
    ...mqConfig,
    address: process.env.PAYMENTSUBMIT_SUB_ADDRESS,
    topic: process.env.PAYMENTSUBMIT_TOPIC_ADDRESS
  }
}

module.exports = config
