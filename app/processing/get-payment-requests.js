const db = require('../data')
const moment = require('moment')
const config = require('../config')

const getPaymentRequests = async () => {
  const transaction = await db.sequelize.transaction()
  try {
    const scheduledPaymentRequests = await getScheduledPaymentRequests(transaction)
    await updateScheduled(scheduledPaymentRequests, transaction)
    await transaction.commit()
    return scheduledPaymentRequests
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

const getScheduledPaymentRequests = async (transaction) => {
  return db.schedule.findAll({
    transaction,
    order: ['planned'],
    limit: config.processingBatchSize,
    include: [{
      model: db.paymentRequest,
      as: 'paymentRequest',
      required: true,
      include: [{
        model: db.invoiceLine,
        as: 'invoiceLines',
        required: true
      }, {
        model: db.scheme,
        as: 'scheme',
        required: true
      }]
    }],
    where: {
      '$paymentRequest.scheme.active$': true,
      planned: { [db.Sequelize.Op.lte]: new Date() },
      completed: null,
      [db.Sequelize.Op.or]: [{
        started: null
      }, {
        started: moment().subtract(5, 'minutes').toDate()
      }]
    }
  })
}

const updateScheduled = async (scheduledPaymentRequests, transaction) => {
  const started = new Date()
  for (const scheduledPaymentRequest of scheduledPaymentRequests) {
    await db.schedule.update({ started }, {
      where: {
        scheduleId: scheduledPaymentRequest.scheduleId
      },
      transaction
    })
  }
}

module.exports = getPaymentRequests
