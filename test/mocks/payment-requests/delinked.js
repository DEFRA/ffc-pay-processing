const { DELINKED } = require('../../../app/constants/schemes')
const paymentRequest = require('./payment-request')

module.exports = {
  ...paymentRequest,
  schemeId: DELINKED
}
