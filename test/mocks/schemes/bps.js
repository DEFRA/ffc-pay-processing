const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { BPS } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: BPS
}
