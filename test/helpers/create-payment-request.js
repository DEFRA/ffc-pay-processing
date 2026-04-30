const { randomUUID } = require('node:crypto')
const { AP } = require('../../app/constants/ledgers')

const createPaymentRequest = ({
  ledger = AP,
  value = 100,
  schemeId,
  agreementNumber = '12345678',
  invoiceNumber = 'INV123456V002',
  paymentRequestNumber = 2,
  referenceId = randomUUID(),
  invoiceLines = [{ description: 'G00', value: 50 }, { description: 'G00', value: 50 }]
} = {}) => {
  const paymentRequest = {
    ledger,
    value,
    schemeId,
    agreementNumber,
    invoiceNumber,
    paymentRequestNumber,
    referenceId,
    invoiceLines
  }

  return paymentRequest
}

module.exports = { createPaymentRequest }
