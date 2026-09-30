const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { SFI_PILOT } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: SFI_PILOT
}
