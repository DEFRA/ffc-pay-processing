const { AR } = require('../../ledgers')
const { SFI } = require('../../schemes')
const noScheduleSchemeCodes = require('./scheme-codes')

const requiresSplit = (paymentRequests) => {
  return paymentRequests[0].schemeId === SFI &&
    !paymentRequests.every(x => x.ledger === AR) &&
    paymentRequests.some(x => x.invoiceLines.some(y => noScheduleSchemeCodes.includes(y.schemeCode)))
}

module.exports = requiresSplit
