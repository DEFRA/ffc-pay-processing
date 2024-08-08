const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { getPaymentRequestByInvoiceAndFrn } = require('../processing/get-payment-request-by-invoice-frn')
const { UNKNOWN } = require('../constants/unknown')
const { SOURCE } = require('../constants/source')
const { PAYMENT_SETTLED, PAYMENT_SETTLEMENT_UNMATCHED, PAYMENT_SETTLEMENT_UNSETTLED } = require('../constants/events')

const sendProcessingReturnEvent = async (message, isError = false) => {
  const invoiceNumber = message.invoiceNumber ?? UNKNOWN
  const frn = message.frn ?? UNKNOWN

  if (!isError) {
    await raiseCompletedReturnEvent(invoiceNumber, frn)
  } else {
    await raiseErrorEvent(invoiceNumber, frn, message.settled)
  }
}

const raiseCompletedReturnEvent = async (invoiceNumber, frn) => {
  if (processingConfig.useV2Events) {
    await raiseV2CompletedReturnEvent(invoiceNumber, frn)
  }
}

const raiseErrorEvent = async (invoiceNumber, frn, settled) => {
  if (processingConfig.useV2Events) {
    await raiseV2ErrorEvent(invoiceNumber, frn, settled)
  }
}

const raiseV2CompletedReturnEvent = async (invoiceNumber, frn) => {
  const paymentRequest = await getPaymentRequestByInvoiceAndFrn(invoiceNumber, frn)
  const event = {
    source: SOURCE,
    type: PAYMENT_SETTLED,
    data: paymentRequest
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

const raiseV2ErrorEvent = async (invoiceNumber, frn, settled) => {
  const event = {
    source: SOURCE,
    type: PAYMENT_SETTLEMENT_UNMATCHED,
    data: {
      message: `Unable to find payment request for settlement, Invoice number: ${invoiceNumber} FRN: ${frn}`,
      frn,
      invoiceNumber
    }
  }
  if (!settled) {
    event.type = PAYMENT_SETTLEMENT_UNSETTLED
    event.data.message = `D365 has reported a settlement for Invoice number ${invoiceNumber}, FRN ${frn} was unsuccessful`
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendProcessingReturnEvent
}
