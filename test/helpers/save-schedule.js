const db = require('../../app/database')
const mockPaymentRequest = require('../mocks/payment-requests/payment-request')
const { savePaymentRequest } = require('./save-payment-request')
const { pickColumns } = require('./table-columns')

const saveSchedule = async (schedule, paymentRequest = mockPaymentRequest) => {
  const { id: paymentRequestId } = await savePaymentRequest(paymentRequest)
  const [savedSchedule] = await db.schedule().insert(pickColumns('schedule', { ...schedule, paymentRequestId })).returning('scheduleId')
  return { scheduleId: savedSchedule.scheduleId, paymentRequestId }
}

module.exports = {
  saveSchedule
}
