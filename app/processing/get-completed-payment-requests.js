const db = require('../data')
const { getCompletedPaymentRequestsFilter } = require('./get-completed-payment-requests-filter')

const getCompletedPaymentRequests = async (paymentRequest) => {
  const filter = getCompletedPaymentRequestsFilter(paymentRequest)

  const completedPaymentRequests = await db.completedPaymentRequest.findAll({
    where: filter,
    order: [['paymentRequestNumber', 'ASC']],
    include: [{
      model: db.completedInvoiceLine,
      as: 'invoiceLines'
    }]
  })

  return completedPaymentRequests.map(x => x.get({ plain: true }))
}

module.exports = {
  getCompletedPaymentRequests
}
