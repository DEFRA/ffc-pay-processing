const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { WMP } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: WMP
}
