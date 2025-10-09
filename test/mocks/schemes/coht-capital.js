const { COHT_CAPITAL } = require('../../../app/constants/schemes')
const scheme = require('./scheme')

module.exports = {
  ...scheme,
  schemeId: COHT_CAPITAL
}
