const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { SFI_EXPANDED } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: SFI_EXPANDED
}
