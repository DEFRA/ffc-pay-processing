const { randomUUID } = require('node:crypto')
const db = require('../database')
const TABLES = require('../constants/tables')
const { pickColumns } = require('../constants/columns')
const { getExistingPaymentRequest } = require('./get-existing-payment-request')
const { saveInvoiceLines } = require('./save-invoice-lines')
const { createSchedule } = require('./create-schedule')
const { sendDuplicatePaymentEvent } = require('../event/send-duplicate-payment-event')

const savePaymentRequest = async (paymentRequest) => {
  const transaction = await db.transaction()
  try {
    const existingPaymentRequest = await getExistingPaymentRequest(paymentRequest.invoiceNumber, transaction)
    if (existingPaymentRequest) {
      console.info(`Duplicate payment request received, skipping ${existingPaymentRequest.invoiceNumber}`)
      await sendDuplicatePaymentEvent(paymentRequest, existingPaymentRequest.referenceId)
    } else {
      delete paymentRequest.paymentRequestId
      const [savedPaymentRequest] = await db.paymentRequest(transaction)
        .insert(pickColumns({ ...paymentRequest, received: new Date(), referenceId: randomUUID() }, TABLES.paymentRequest))
        .returning('paymentRequestId')
      await saveInvoiceLines(paymentRequest.invoiceLines, savedPaymentRequest.paymentRequestId, transaction)
      await createSchedule(savedPaymentRequest.paymentRequestId, transaction)
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = {
  savePaymentRequest
}
