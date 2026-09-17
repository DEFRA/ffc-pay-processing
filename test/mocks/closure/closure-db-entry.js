const { getSchemeIds } = require('ffc-pay-schemes')
const { FRN } = require('../values/frn')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')
const { CLOSURETIMESTAMP } = require('../values/closure-date')

const { SFI } = getSchemeIds()

const closureDBEntry = {
  closedId: 1,
  schemeId: SFI,
  frn: FRN,
  agreementNumber: AGREEMENT_NUMBER,
  closureDate: CLOSURETIMESTAMP
}

module.exports = {
  closureDBEntry
}
