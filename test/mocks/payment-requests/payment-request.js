const { getSchemeIds, getSourceSystems } = require('ffc-pay-schemes')
const { CORRELATION_ID } = require('../values/correlation-id')
const { BATCH } = require('../values/batch')
const { DELIVERY_BODY_RPA } = require('../values/delivery-body')
const { INVOICE_NUMBER } = require('../values/invoice-number')
const { FRN } = require('../values/frn')
const { SBI } = require('../values/sbi')
const { PAYMENT_REQUEST_NUMBER } = require('../values/payment-request-number')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')
const { CONTRACT_NUMBER } = require('../values/contract-number')
const { BALANCE } = require('../values/payment-type')
const { MARKETING_YEAR } = require('../values/marketing-year')
const { GBP } = require('../../../app/constants/currency')
const { Q4 } = require('../../../app/constants/schedules')
const { DUE_DATE } = require('../values/due-date')
const { AP } = require('../../../app/constants/ledgers')
const invoiceLine = require('./invoice-line')

const { SFI } = getSchemeIds()
const { SFI: SOURCE_SYSTEM } = getSourceSystems()

module.exports = {
  correlationId: CORRELATION_ID,
  schemeId: SFI,
  sourceSystem: SOURCE_SYSTEM,
  batch: BATCH,
  deliveryBody: DELIVERY_BODY_RPA,
  invoiceNumber: INVOICE_NUMBER,
  frn: FRN,
  sbi: SBI,
  paymentRequestNumber: PAYMENT_REQUEST_NUMBER,
  agreementNumber: AGREEMENT_NUMBER,
  contractNumber: CONTRACT_NUMBER,
  paymentType: BALANCE,
  marketingYear: MARKETING_YEAR,
  currency: GBP,
  schedule: Q4,
  dueDate: DUE_DATE,
  value: 100,
  ledger: AP,
  invoiceLines: [invoiceLine]
}
