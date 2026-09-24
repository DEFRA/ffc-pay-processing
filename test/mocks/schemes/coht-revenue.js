const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { COHT_REVENUE } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: COHT_REVENUE
}
