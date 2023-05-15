const db = require('../../app/data')
const { savePaymentRequest } = require('./save-payment-request')
const mockPaymentRequest = require('../mocks/payment-requests/payment-request')

const saveSchedule = async (schedule, paymentRequest = mockPaymentRequest) => {
  const { id: paymentRequestId } = await savePaymentRequest(paymentRequest)
  const savedSchedule = await db.schedule.create({ ...schedule, paymentRequestId })
  return savedSchedule.scheduleId
}

module.exports = {
  saveSchedule
}
