const { messageConfig } = require('../config')
const { createServiceBusClient, createReceiver, subscribeReceiver, closeSenders } = require('./service-bus')
const { processPaymentMessage } = require('./process-payment-message')
const { processAcknowledgementMessage } = require('./process-acknowledgement-message')
const { processReturnMessage } = require('./process-return-message')
const { processQualityCheckMessage } = require('./process-quality-check-message')
const { processManualLedgerCheckMessage } = require('./process-manual-ledger-check-message')
const { processXbResponseMessage } = require('./process-xb-response-message')
const { start: startOutbox } = require('../outbound')
const { createDiagnosticsHandler } = require('./diagnostics')
const { processRetentionMessage } = require('./process-retention-message')

const receivers = []
const clients = []

const createAndSubscribeReceiver = async (config, action, name) => {
  const sbClient = createServiceBusClient(config)
  clients.push(sbClient)

  const receiver = createReceiver(sbClient, config)
  receivers.push(receiver)

  await subscribeReceiver(receiver, action, createDiagnosticsHandler(name), config)
}

const start = async () => {
  for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
    const paymentAction = (message, receiver) => processPaymentMessage(message, receiver)
    await createAndSubscribeReceiver(messageConfig.processingSubscription, paymentAction, `payment-receiver-${i + 1}`)
    console.info(`Receiver ${i + 1} ready to receive payment requests`)
  }

  await startOutbox()
  console.info('Ready to publish payment requests')

  await createAndSubscribeReceiver(messageConfig.acknowledgementSubscription, (message, receiver) => processAcknowledgementMessage(message, receiver), 'acknowledgement-receiver')
  await createAndSubscribeReceiver(messageConfig.returnSubscription, (message, receiver) => processReturnMessage(message, receiver), 'return-receiver')
  await createAndSubscribeReceiver(messageConfig.qcSubscription, (message, receiver) => processQualityCheckMessage(message, receiver), 'qc-receiver')
  await createAndSubscribeReceiver(messageConfig.qcManualSubscription, (message, receiver) => processManualLedgerCheckMessage(message, receiver), 'manual-ledger-receiver')
  await createAndSubscribeReceiver(messageConfig.xbResponseSubscription, (message, receiver) => processXbResponseMessage(message, receiver), 'xb-response-receiver')
  await createAndSubscribeReceiver(messageConfig.retentionSubscription, (message, receiver) => processRetentionMessage(message, receiver), 'retention-receiver')

  console.log('Message subscriptions active')
}

const stop = async () => {
  for (const receiver of receivers) {
    try {
      await receiver.close()
    } catch (err) {
      console.error('Error closing receiver:', err)
    }
  }
  receivers.length = 0

  for (const client of clients) {
    try {
      await client.close()
    } catch (err) {
      console.error('Error closing Service Bus client:', err)
    }
  }
  clients.length = 0

  await closeSenders()
}

module.exports = { start, stop }
