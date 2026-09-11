const { getSchemeIds } = require('ffc-pay-schemes')

const { SFI23 } = getSchemeIds()

const removeSettledSFI23AdvancePayments = (paymentRequests) => {
  return paymentRequests.filter(x => !(x.schemeId === SFI23 && x.paymentRequestNumber === 0 && x.settledValue && /^.*2023$/.test(x.dueDate)))
}

module.exports = {
  removeSettledSFI23AdvancePayments
}
