const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { SFI23 } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: SFI23
}
