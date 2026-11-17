const db = require('../database')

const getHeldPaymentRequests = async (frn, schemeId, { paymentRequestId, transaction } = {}) => {
  const hold = await db.hold(transaction ?? undefined)
    .join('holdCategories', 'holds.holdCategoryId', 'holdCategories.holdCategoryId')
    .where({ 'holds.frn': frn, 'holdCategories.schemeId': schemeId })
    .whereNull('holds.closed')
    .first()

  if (!hold) {
    return []
  }

  const query = db.paymentRequest(transaction ?? undefined)
    .select('paymentRequests.*')
    .join('schedule', 'paymentRequests.paymentRequestId', 'schedule.paymentRequestId')
    .where({ 'paymentRequests.frn': frn, 'paymentRequests.schemeId': schemeId })
    .whereNull('schedule.completed')

  if (paymentRequestId) {
    query.where('paymentRequests.paymentRequestId', paymentRequestId)
  }

  const paymentRequests = await query

  if (!paymentRequests.length) {
    return []
  }

  const invoiceLines = await db.invoiceLine(transaction ?? undefined)
    .whereIn('paymentRequestId', paymentRequests.map(x => x.paymentRequestId))
    .where('invalid', '<>', true)
    .orderBy('invoiceLineId', 'asc')

  return paymentRequests.map(paymentRequest => ({
    ...paymentRequest,
    invoiceLines: invoiceLines.filter(x => x.paymentRequestId === paymentRequest.paymentRequestId)
  }))
}

module.exports = {
  getHeldPaymentRequests
}
