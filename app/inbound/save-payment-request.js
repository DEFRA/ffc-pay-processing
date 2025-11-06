const { v4: uuidv4 } = require('uuid')
const db = require('../data')
const { getExistingPaymentRequest } = require('./get-existing-payment-request')
const { saveInvoiceLines } = require('./save-invoice-lines')
const { createSchedule } = require('./create-schedule')

const savePaymentRequest = async (paymentRequest) => {
  const transaction = await db.sequelize.transaction()
  try {
    const existingPaymentRequest = await getExistingPaymentRequest(paymentRequest.invoiceNumber, transaction)
    if (existingPaymentRequest) {
      console.info(`Duplicate payment request received, skipping ${existingPaymentRequest.invoiceNumber}`)
    } else {
      delete paymentRequest.paymentRequestId
      const savedPaymentRequest = await db.paymentRequest.create({ ...paymentRequest, received: new Date(), referenceId: uuidv4(), sentToTracking: true }, { transaction })
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
