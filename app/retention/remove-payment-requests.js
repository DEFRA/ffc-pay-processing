const db = require('../data')

const removePaymentRequests = async (paymentRequestIds, transaction) => {
  await db.paymentRequest.destroy({
    where: { paymentRequestId: paymentRequestIds },
    transaction
  })
}

module.exports = {
  removePaymentRequests
}
