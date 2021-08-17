const { getPaymentHolds, addPaymentHold, removePaymentHold } = require('../payment-hold')
const { convertPaymentHolds} = require('../payment-hold/utils')
const joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/payment-holds',
  options: {
    handler: async (request, h) => {
      const paymentHolds = convertPaymentHolds(await getPaymentHolds(request.query.open))
      return h.response({
        paymentHolds
      })
    }
  }
},
{
  method: 'POST',
  path: '/add-payment-hold',
  options: {
    validate: {
      payload: joi.object({
        frn: joi.number(),
        async: joi.boolean().default(false)
      })
    },
    handler: async (request, h) => {
      await addPaymentHold(request.payload.frn, request.payload.holdCategoryId)
      return h.response('ok').code(200)
    }
  }
},
{
  method: 'POST',
  path: '/remove-payment-hold',
  options: {
    validate: {
      payload: joi.object({
        holdId: joi.number(),
        async: joi.boolean().default(false)
      })
    },
    handler: async (request, h) => {
      await removePaymentHold(request.payload.holdId)
      return h.response('ok').code(200)
    }
  }
}]
