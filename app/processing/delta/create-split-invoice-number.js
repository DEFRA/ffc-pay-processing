const { SFI, LUMP_SUMS, SFI_PILOT } = require('../../schemes')

const createSplitInvoiceNumber = (invoiceNumber, splitId, schemeId) => {
  switch (schemeId) {
    case SFI:
    case SFI_PILOT:
    case LUMP_SUMS:
      return createSitiAgriInvoiceNumber(invoiceNumber, splitId)
    default:
      return createDefaultInvoiceNumber(invoiceNumber, splitId)
  }
}

const createSitiAgriInvoiceNumber = (invoiceNumber, splitId) => {
  // an invoice number is a string made up of three elements, to inject a split id character into the string we need to identify the position of those elements
  // we also need to trim the first character of the final element
  const isNew = isNotSplit(invoiceNumber)
  const firstElementLength = 8
  const originalFinalElementLength = 3
  const newFinalElementLength = 2
  return isNew
    ? `${invoiceNumber.slice(0, firstElementLength)}${splitId}${invoiceNumber.slice(firstElementLength, invoiceNumber.length - originalFinalElementLength)}${invoiceNumber.slice(invoiceNumber.length - newFinalElementLength)}`
    : `${invoiceNumber.slice(0, firstElementLength)}${splitId}${invoiceNumber.slice(firstElementLength + 1)}`
}

const createDefaultInvoiceNumber = (invoiceNumber, splitId) => {
  // an invoice number is a string made up of two elements, to inject a split id character into the string we need to identify the position of those elements
  // we also need to trim the first character of the final element
  const isNew = isNotSplit(invoiceNumber)
  const finalElementIndexLength = 4
  const originalFinalElementLength = 3
  const newFinalElementLength = 2
  return isNew
    ? `${invoiceNumber.slice(0, invoiceNumber.length - finalElementIndexLength)}${splitId}${invoiceNumber.slice(invoiceNumber.length - finalElementIndexLength, invoiceNumber.length - originalFinalElementLength)}${invoiceNumber.slice(invoiceNumber.length - newFinalElementLength)}`
    : `${invoiceNumber.slice(0, invoiceNumber.length - finalElementIndexLength)}${splitId}${invoiceNumber.slice(invoiceNumber.length - finalElementIndexLength + 1)}`
}

const isNotSplit = (invoiceNumber) => {
  // invoice numbers that have not already been split will end V followed by three digits.  Whereas split numbers end with only two digits
  return /V\d{3}$/.test(invoiceNumber)
}

module.exports = createSplitInvoiceNumber
