const { messageConfig } = require('../config')
const { MessageReceiver } = require('ffc-messaging')
const { processPaymentMessage } = require('./process-payment-message')
const { processAcknowledgementMessage } = require('./process-acknowledgement-message')
const { processReturnMessage } = require('./process-return-message')
const { processQualityCheckMessage } = require('./process-quality-check-message')
const { processManualLedgerCheckMessage } = require('./process-manual-ledger-check-message')
const { processXbResponseMessage } = require('./process-xb-response-message')
const { start: startOutbox } = require('../outbound')
const { createDiagnosticsHandler } = require('./diagnostics')

let acknowledgementReceiver
let returnReceiver
let qualityCheckReceiver
let manualLedgerCheckReceiver
let xbResponseReceiver

const recievers = []

const start = async () => {
  for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
    let paymentReceiver // eslint-disable-line 
    const paymentAction = message => processPaymentMessage(message, paymentReceiver)
    paymentReceiver = new MessageReceiver(messageConfig.processingSubscription, paymentAction)
    await paymentReceiver.subscribe(createDiagnosticsHandler(`payment-receiver-${i + 1}`))
    recievers.push(paymentReceiver)
    console.info(`Receiver ${i + 1} ready to receive payment requests`)
  }

  await startOutbox()
  console.info('Ready to publish payment requests')

  const acknowledgementAction = message => processAcknowledgementMessage(message, acknowledgementReceiver)
  acknowledgementReceiver = new MessageReceiver(messageConfig.acknowledgementSubscription, acknowledgementAction)
  await acknowledgementReceiver.subscribe(createDiagnosticsHandler('acknowledgement-receiver'))
  recievers.push(acknowledgementReceiver)

  const returnAction = message => processReturnMessage(message, returnReceiver)
  returnReceiver = new MessageReceiver(messageConfig.returnSubscription, returnAction)
  await returnReceiver.subscribe(createDiagnosticsHandler('return-receiver'))
  recievers.push(returnReceiver)

  const qualityCheckAction = message => processQualityCheckMessage(message, qualityCheckReceiver)
  qualityCheckReceiver = new MessageReceiver(messageConfig.qcSubscription, qualityCheckAction)
  await qualityCheckReceiver.subscribe(createDiagnosticsHandler('qc-receiver'))
  recievers.push(qualityCheckReceiver)

  const manualLedgerCheckAction = message => processManualLedgerCheckMessage(message, manualLedgerCheckReceiver)
  manualLedgerCheckReceiver = new MessageReceiver(messageConfig.qcManualSubscription, manualLedgerCheckAction)
  await manualLedgerCheckReceiver.subscribe(createDiagnosticsHandler('manual-ledger-receiver'))
  recievers.push(manualLedgerCheckReceiver)

  const xbResponseAction = message => processXbResponseMessage(message, xbResponseReceiver)
  xbResponseReceiver = new MessageReceiver(messageConfig.xbResponseSubscription, xbResponseAction)
  await xbResponseReceiver.subscribe(createDiagnosticsHandler('xb-response-receiver'))
  recievers.push(xbResponseReceiver)

  console.log('Message subscriptions active')
}

const stop = async () => {
  for (const receiver of recievers) {
    await receiver.closeConnection()
  }
}

module.exports = { start, stop }
