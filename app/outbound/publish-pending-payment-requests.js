const util = require('util')
const { MessageBatchSender } = require('ffc-messaging')
const db = require('../data')
const { messageConfig } = require('../config')
const { getPendingPaymentRequests } = require('./get-pending-payment-requests')
const { createMessage } = require('../messaging/create-message')
const { sendPublishingEvents, sendProcessingErrorEvent } = require('../event')
const { updatePendingPaymentRequests } = require('./update-pending-payment-requests')
const { PROCESSED } = require('../constants/messages')

const publishPendingPaymentRequests = async (submitted = new Date()) => {
  const transaction = await db.sequelize.transaction()
  try {
    const paymentRequests = await getPendingPaymentRequests(transaction)
    if (paymentRequests.length) {
      const messages = paymentRequests.map(message => createMessage(message, PROCESSED))
      const sender = new MessageBatchSender(messageConfig.submitTopic)
      await sendPublishingEvents(paymentRequests)
      await sender.sendBatchMessages(messages)
      await sender.closeConnection()
      await updatePendingPaymentRequests(paymentRequests, submitted, transaction)
      console.log('Payment requests processed:', util.inspect(messages.map(x => x.body), false, null, true))
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    await sendProcessingErrorEvent(null, error)
    throw (error)
  }
}

module.exports = {
  publishPendingPaymentRequests
}
