const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { SFI26 } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: SFI26
}
