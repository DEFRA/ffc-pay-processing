const { v4: uuidv4 } = require('uuid')
const { SINGLE } = require('../../schedules')
const calculateOverallDelta = require('../delta/calculate-overall-delta')
const createSplitInvoiceNumber = require('../delta/create-split-invoice-number')
const getNextSplitId = require('./get-next-split-id')
const noScheduleSchemeCodes = require('./scheme-codes')

const hybridScheduleSplit = (paymentRequest, splitId) => {
  const schedulePaymentRequest = copyPaymentRequest(paymentRequest, splitId, paymentRequest.schedule)
  const noSchedulePaymentRequest = copyPaymentRequest(paymentRequest, getNextSplitId(splitId), SINGLE)

  paymentRequest.invoiceLines.forEach(invoiceLine => {
    if (!noScheduleSchemeCodes.includes(invoiceLine.schemeCode)) {
      schedulePaymentRequest.invoiceLines.push(invoiceLine)
    } else {
      noSchedulePaymentRequest.invoiceLines.push(invoiceLine)
    }
  })

  noSchedulePaymentRequest.value = calculateOverallDelta(noSchedulePaymentRequest.invoiceLines)
  schedulePaymentRequest.value = calculateOverallDelta(schedulePaymentRequest.invoiceLines)

  return [schedulePaymentRequest, noSchedulePaymentRequest]
}

const copyPaymentRequest = (paymentRequest, splitId, schedule) => {
  return {
    ...paymentRequest,
    schedule,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.invoiceNumber, splitId, paymentRequest.schemeId),
    invoiceLines: [],
    referenceId: uuidv4()
  }
}

module.exports = hybridScheduleSplit
