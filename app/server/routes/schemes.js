const { getSchemes } = require('../../schemes')

module.exports = [{
  method: 'GET',
  path: '/payment-schemes',
  options: {
    handler: async (request, h) => {
      const paymentSchemes = await getSchemes()
      return h.response({
        paymentSchemes
      })
    }
  }
}]
