const { getTrackingPaymentRequests } = require('../../tracking-migration')

module.exports = [{
  method: 'GET',
  path: '/tracking-migration',
  options: {
    handler: async (request, h) => {
      const paymentRequestsBatch = await getTrackingPaymentRequests(request.query.limit)
      return h.response({
        paymentRequestsBatch
      })
    }
  }
}]
