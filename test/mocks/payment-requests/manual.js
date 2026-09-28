const { getSchemeIds, getSchemeProperties } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { SFI, MANUAL } = getSchemeIds()
const SFI_PROPS = getSchemeProperties(SFI)

module.exports = {
  ...paymentRequest,
  schemeId: MANUAL,
  pillar: SFI_PROPS.pillar
}
