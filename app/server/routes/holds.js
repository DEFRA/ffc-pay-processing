const joi = require('joi')
const boom = require('@hapi/boom')
const { GET, POST } = require('../../constants/methods')
const { getHolds, addHold, addBulkHold, removeBulkHold, removeHoldById, getHoldCategories, addHoldType, editHoldType, removeHoldType } = require('../../holds')
const { HTTP_OK } = require('../../constants/http-status-codes')
const { OK } = require('../../constants/ok')

module.exports = [
  {
    method: GET,
    path: '/payment-holds',
    options: {
      handler: async (request, h) => {
        const paymentHolds = await getHolds({
          pageNumber: request.query.page,
          pageSize: request.query.pageSize
        }, request.query.open)
        return h.response({ paymentHolds })
      }
    }
  },
  {
    method: GET,
    path: '/payment-hold-categories',
    options: {
      handler: async (_request, h) => {
        const paymentHoldCategories = await getHoldCategories()
        return h.response({ paymentHoldCategories })
      }
    }
  },
  {
    method: POST,
    path: '/add-payment-hold',
    options: {
      validate: {
        payload: joi.object({
          frn: joi.number().required(),
          holdCategoryId: joi.number().required()
        }),
        failAction: (_request, _h, error) => {
          return boom.badRequest(error)
        }
      },
      handler: async (request, h) => {
        await addHold(request.payload.frn, request.payload.holdCategoryId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  },
  {
    method: POST,
    path: '/payment-holds/bulk/add',
    options: {
      handler: async (request, h) => {
        await addBulkHold(request.payload.data, request.payload.holdCategoryId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  },
  {
    method: POST,
    path: '/remove-payment-hold',
    options: {
      validate: {
        payload: joi.object({
          holdId: joi.number().required()
        }),
        failAction: (_request, _h, error) => {
          return boom.badRequest(error)
        }
      },
      handler: async (request, h) => {
        await removeHoldById(request.payload.holdId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  },
  {
    method: POST,
    path: '/payment-holds/bulk/remove',
    options: {
      handler: async (request, h) => {
        await removeBulkHold(request.payload.data, request.payload.holdCategoryId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  },
  {
    method: POST,
    path: '/add-hold-type',
    options: {
      validate: {
        payload: joi.object({
          categoryName: joi.string().required(),
          schemeId: joi.number().required()
        }),
        failAction: (_request, _h, error) => {
          return boom.badRequest(error)
        }
      },
      handler: async (request, h) => {
        await addHoldType(request.payload.categoryName, request.payload.schemeId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  },
  {
    method: POST,
    path: '/edit-hold-type',
    options: {
      validate: {
        payload: joi.object({
          categoryName: joi.string().required(),
          holdCategoryId: joi.number().required()
        }),
        failAction: (_request, _h, error) => {
          return boom.badRequest(error)
        }
      },
      handler: async (request, h) => {
        await editHoldType(request.payload.categoryName, request.payload.holdCategoryId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  },
  {
    method: POST,
    path: '/remove-hold-type',
    options: {
      validate: {
        payload: joi.object({
          holdCategoryId: joi.number().required()
        }),
        failAction: (_request, _h, error) => {
          return boom.badRequest(error)
        }
      },
      handler: async (request, h) => {
        await removeHoldType(request.payload.holdCategoryId)
        return h.response(OK).code(HTTP_OK)
      }
    }
  }
]
