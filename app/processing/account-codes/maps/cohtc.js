const { SOS710, SOS920, SOS929 } = require('../../../constants/account-codes/ap')
const { SOS750, SOS940, SOS949 } = require('../../../constants/account-codes/ar-admin')
const { SOS770, SOS960, SOS969 } = require('../../../constants/account-codes/ar-irregular')
const { G00, P02, P24 } = require('../../../constants/line-codes')

module.exports = [{
  lineCode: G00,
  ap: SOS710,
  arAdmin: SOS750,
  arIrregular: SOS770
}, {
  lineCode: P02,
  ap: SOS920,
  arAdmin: SOS940,
  arIrregular: SOS960
}, {
  lineCode: P24,
  ap: SOS929,
  arAdmin: SOS949,
  arIrregular: SOS969
}]
