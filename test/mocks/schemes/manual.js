const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { MANUAL } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: MANUAL
}
