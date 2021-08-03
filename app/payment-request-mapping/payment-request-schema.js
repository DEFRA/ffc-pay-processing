const Joi = require('joi')

module.exports = Joi.object({
  sourceSystem: Joi.string().allow(''),
  deliveryBody: Joi.string().allow(''),
  invoiceNumber: Joi.string().allow(''),
  frn: Joi.number().greater(1000000000).less(9999999999).optional(),
  sbi: Joi.number().integer().greater(105000000).less(999999999).optional(),
  paymentRequestNumber: Joi.number().required(),
  agreementNumber: Joi.string().required(),
  contractNumber: Joi.string().required(),
  currency: Joi.string().required(),
  schedule: Joi.string().required(),
  dueDate: Joi.date().required(),
  value: Joi.number().required(),
  marketingYear: Joi.number().integer().greater(2021).less(2099),
  invoiceLines: Joi.array().required().items(Joi.object({
    standardCode: Joi.string().required(),
    accountCode: Joi.string().required(),
    fundCode: Joi.string().required(),
    description: Joi.string().required(),
    value: Joi.number().required()
  }))
})
