const { deleteCompletedInvoiceLines } = require('./delete-completed-invoice-lines')
const { deleteCompletedPaymentRequests } = require('./delete-completed-payment-requests')
const { deleteInvoiceLines } = require('./delete-invoice-lines')
const { deleteOutbox } = require('./delete-outbox')
const { deletePaymentRequests } = require('./delete-payment-requests')
const { deleteSchedule } = require('./delete-schedule')

module.exports = {
  deleteCompletedInvoiceLines,
  deleteCompletedPaymentRequests,
  deleteInvoiceLines,
  deleteOutbox,
  deletePaymentRequests,
  deleteSchedule
}
