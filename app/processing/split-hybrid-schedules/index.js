const { AP, AR } = require('../../ledgers')
const getHybridScheduleSplit = require('./get-hybrid-schedule-split')
const requiresSplit = require('./requires-split')

const splitHybridSchedules = (paymentRequests) => {
  // some SFI funding options should be paid immediately as opposed to split across payment schedule.
  // we therefore need to split into separate payment requests.
  if (!requiresSplit(paymentRequests)) {
    return paymentRequests
  }

  console.log(`Performing hybrid schedule split for ${paymentRequests[0].invoiceNumber}`)

  const apPaymentRequests = paymentRequests.filter(x => x.ledger === AP)
  const arPaymentRequests = paymentRequests.filter(x => x.ledger === AR)

  const splitPaymentRequests = getHybridScheduleSplit(apPaymentRequests)

  return arPaymentRequests.concat(splitPaymentRequests)
}

module.exports = splitHybridSchedules
