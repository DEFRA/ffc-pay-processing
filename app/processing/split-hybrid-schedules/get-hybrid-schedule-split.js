const getNextSplitId = require('./get-next-split-id')
const hybridScheduleSplit = require('./hybrid-schedule-split')

const getHybridScheduleSplit = (paymentRequests) => {
  const finalPaymentRequests = []
  let splitId = 'C'
  paymentRequests.forEach(paymentRequest => {
    const splitRequests = hybridScheduleSplit(paymentRequest, splitId)
    splitRequests.forEach(splitRequest => {
      finalPaymentRequests.push(splitRequest)
    })
    splitId = getNextSplitId(splitId, 2)
  })
  return finalPaymentRequests
}

module.exports = getHybridScheduleSplit
