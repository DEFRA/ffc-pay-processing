const { SFI23 } = require('../../constants/schemes')

const removeSettledSFI23AdvancePayments = (paymentRequests) => {
  return paymentRequests.filter(x => !(x.schemeId === SFI23 && x.paymentRequestNumber === 0 && x.settledValue && /^.*2023$/.test(x.dueDate)))
}

module.exports = {
  removeSettledSFI23AdvancePayments
}
