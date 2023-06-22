const { AP } = require('../../constants/ledgers')

const getTotalValue = (paymentRequests) => {
  return paymentRequests.filter(x => x.ledger === AP).reduce((x, y) => x + (y.value ?? 0), 0)
}

module.exports = {
  getTotalValue
}
