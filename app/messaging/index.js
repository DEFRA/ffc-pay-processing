const { messageConfig } = require('../config')
const { MessageReceiver } = require('ffc-messaging')
const processPaymentMessage = require('./process-payment-message')
const processAcknowledgementMessage = require('./process-acknowledgement-message')
const processReturnMessage = require('./process-return-message')
const processQualityCheckMessage = require('./process-quality-check-message')
const processManualLedgerCheckMessage = require('./process-manual-ledger-check-message')
const outbox = require('./outbox')
const paymentReceivers = []
let acknowledgementReceiver
let returnReceiver
let qualityCheckReceiver
let manualLedgerCheckReceiver

const start = async () => {
  for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
    let paymentReceiver  // eslint-disable-line
    const paymentAction = message => processPaymentMessage(message, paymentReceiver)
    paymentReceiver = new MessageReceiver(messageConfig.processingSubscription, paymentAction)
    paymentReceivers.push(paymentReceiver)
    await paymentReceiver.subscribe()
    console.info(`Receiver ${i + 1} ready to receive payment requests`)
  }
  await outbox.start()
  console.info('Ready to publish payment requests')

  const acknowledgementAction = message => processAcknowledgementMessage(message, acknowledgementReceiver)
  acknowledgementReceiver = new MessageReceiver(messageConfig.acknowledgementSubscription, acknowledgementAction)
  await acknowledgementReceiver.subscribe()

  const returnAction = message => processReturnMessage(message, returnReceiver)
  returnReceiver = new MessageReceiver(messageConfig.returnSubscription, returnAction)
  await returnReceiver.subscribe()

  const qualityCheckAction = message => processQualityCheckMessage(message, qualityCheckReceiver)
  qualityCheckReceiver = new MessageReceiver(messageConfig.qcSubscription, qualityCheckAction)
  await qualityCheckReceiver.subscribe()

  const manualLedgerCheckAction = message => processManualLedgerCheckMessage(message, manualLedgerCheckReceiver)
  manualLedgerCheckReceiver = new MessageReceiver(messageConfig.qcManualSubscription, manualLedgerCheckAction)
  await manualLedgerCheckReceiver.subscribe()
}

const stop = async () => {
  for (const paymentReceiver of paymentReceivers) {
    await paymentReceiver.closeConnection()
  }
}

module.exports = { start, stop }
