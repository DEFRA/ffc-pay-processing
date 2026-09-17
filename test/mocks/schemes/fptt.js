const { getSchemeIds } = require('ffc-pay-schemes')
const scheme = require('./scheme')

const { FPTT } = getSchemeIds()

module.exports = {
  ...scheme,
  schemeId: FPTT
}
