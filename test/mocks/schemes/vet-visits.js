const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { VET_VISITS } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: VET_VISITS
}
