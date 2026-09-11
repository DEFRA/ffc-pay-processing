const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { COHT_CAPITAL } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: COHT_CAPITAL
}
