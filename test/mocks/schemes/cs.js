const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { CS } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: CS
}
