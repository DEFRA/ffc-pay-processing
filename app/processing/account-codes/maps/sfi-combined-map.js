const { SOS710, SOS921, SOS922, SOS923, SOS924, SOS925, SOS926, SOS927 } = require('../../../constants/account-codes/ap')
const { SOS750, SOS941, SOS942, SOS943, SOS944, SOS945, SOS946, SOS947 } = require('../../../constants/account-codes/ar-admin')
const { SOS770, SOS961, SOS962, SOS963, SOS964, SOS965, SOS966, SOS967 } = require('../../../constants/account-codes/ar-irregular')
const { G00, P05, P06, P08, P14, P22, P23, P24 } = require('../../../constants/line-codes')

module.exports = [{
  lineCode: G00,
  ap: SOS710,
  arAdmin: SOS750,
  arIrregular: SOS770
}, {
  lineCode: P05,
  ap: SOS921,
  arAdmin: SOS941,
  arIrregular: SOS961
}, {
  lineCode: P06,
  ap: SOS922,
  arAdmin: SOS942,
  arIrregular: SOS962
}, {
  lineCode: P08,
  ap: SOS923,
  arAdmin: SOS943,
  arIrregular: SOS963
}, {
  lineCode: P14,
  ap: SOS924,
  arAdmin: SOS944,
  arIrregular: SOS964
}, {
  lineCode: P22,
  ap: SOS925,
  arAdmin: SOS945,
  arIrregular: SOS965
}, {
  lineCode: P23,
  ap: SOS926,
  arAdmin: SOS946,
  arIrregular: SOS966
}, {
  lineCode: P24,
  ap: SOS927,
  arAdmin: SOS947,
  arIrregular: SOS967
}]
