const { getSchemeIds } = require('ffc-pay-schemes')

const { SFI23 } = getSchemeIds()

const getFirstPaymentRequest = (paymentRequests, previousPaymentRequests) => {
  const firstPaymentRequest = previousPaymentRequests?.find(x => x.paymentRequestNumber === 1)

  if (firstPaymentRequest && paymentRequests[0].schemeId !== SFI23) {
    return firstPaymentRequest
  }

  if (paymentRequests[0].schemeId !== SFI23) {
    return undefined
  }

  // SFI 23 advance payments means there will not be a PR1 in the previous payment requests if we are processing PR1.  We can get the schedule from current.
  if (paymentRequests[0].paymentRequestNumber === 1) {
    return {
      schedule: paymentRequests[0].schedule,
      dueDate: paymentRequests[0].dueDate
    }
  }

  const advancePayment = previousPaymentRequests?.find(x => x.paymentRequestNumber === 0)
  // if this is not PR1 then we can't rely on the PR1 schedule as it will have been amended to accommodate the advanced payment
  // so it is restored to back to full schedule, only if the Q1 payment has not been made
  if (firstPaymentRequest && advancePayment && !advancePayment.settledValue && /^.*2023$/.test(advancePayment?.dueDate)) {
    return {
      schedule: `${firstPaymentRequest.schedule.charAt(0)}4`,
      dueDate: paymentRequests[0].dueDate
    }
  }

  return firstPaymentRequest
}

module.exports = {
  getFirstPaymentRequest
}
