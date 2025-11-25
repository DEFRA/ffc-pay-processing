const { DRD10 } = require('../../app/constants/domestic-fund-codes')
const { G00 } = require('../../app/constants/line-codes')
const { AGREEMENT_NUMBER } = require('../mocks/values/agreement-number')
const { SCHEME_CODE } = require('../mocks/values/scheme-code')

const createInvoiceLine = ({
  value,
  agreementNumber = AGREEMENT_NUMBER,
  schemeCode = SCHEME_CODE,
  convergence = false,
  marketingYear
} = {}) => ({
  schemeCode,
  fundCode: DRD10,
  agreementNumber,
  description: G00,
  value,
  convergence,
  marketingYear
})

const createSimpleInvoiceLine = ({ description = G00, value }) => ({
  schemeCode: SCHEME_CODE,
  fundCode: DRD10,
  description,
  value
})

module.exports = { createInvoiceLine, createSimpleInvoiceLine }
