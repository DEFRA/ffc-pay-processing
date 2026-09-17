const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { DELINKED } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: DELINKED
}
