const db = require('../data')
const getExistingPaymentRequest = require('./get-existing-payment-request')
const createSchedule = require('./create-schedule')
const saveInvoiceLines = require('./save-invoice-lines')
const { v4: uuidv4 } = require('uuid')

const savePaymentRequest = async (paymentRequest) => {
  const transaction = await db.sequelize.transaction()
  try {
    const existingPaymentRequest = await getExistingPaymentRequest(paymentRequest.invoiceNumber, transaction)
    if (existingPaymentRequest) {
      console.info(`Duplicate payment request received, skipping ${existingPaymentRequest.invoiceNumber}`)
      await transaction.rollback()
    } else {
      delete paymentRequest.paymentRequestId
      const savedPaymentRequest = await db.paymentRequest.create({ ...paymentRequest, received: new Date(), referenceId: uuidv4() }, { transaction })
      await saveInvoiceLines(paymentRequest.invoiceLines, savedPaymentRequest.paymentRequestId, transaction)
      await createSchedule(paymentRequest.schemeId, savedPaymentRequest.paymentRequestId, transaction)
      await transaction.commit()
    }
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = savePaymentRequest
