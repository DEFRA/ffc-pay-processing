const { COHT_REVENUE } = require('../../../app/constants/schemes')
const scheme = require('./scheme')

module.exports = {
  ...scheme,
  schemeId: COHT_REVENUE
}
