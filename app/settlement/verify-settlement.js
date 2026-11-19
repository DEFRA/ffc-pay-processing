const { FDMR } = require('../constants/invoice-patterns')

const checkInvoiceNumberBlocked = (invoiceNumber) => FDMR.test(invoiceNumber)

module.exports = {
  checkInvoiceNumberBlocked
}
