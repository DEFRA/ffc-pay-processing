const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { LUMP_SUMS } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: LUMP_SUMS
}
