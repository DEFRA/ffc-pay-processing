const db = require('../database')
const { removeNullProperties } = require('../remove-null-properties')
const { processingConfig } = require('../config')

const getPendingPaymentRequests = async (transaction) => {
  const { rows: outbox } = await (transaction ?? db.client).raw(`
    SELECT
      "outbox".*
    FROM "outbox"
    INNER JOIN "completedPaymentRequests"
      ON "outbox"."completedPaymentRequestId" = "completedPaymentRequests"."completedPaymentRequestId"
    INNER JOIN "completedInvoiceLines"
      ON "completedPaymentRequests"."completedPaymentRequestId" = "completedInvoiceLines"."completedPaymentRequestId"
    WHERE "outbox"."submitted" IS NULL
      AND "completedPaymentRequests"."submitted" IS NULL
    ORDER BY "completedPaymentRequests"."paymentRequestId"
    LIMIT :processingCap
    FOR UPDATE OF "outbox" SKIP LOCKED
    `, {
    processingCap: processingConfig.processingCap
  })

  const completedPaymentRequestIds = outbox.map(x => x.completedPaymentRequestId)

  const completedPaymentRequests = await db.completedPaymentRequest(transaction ?? undefined)
    .whereIn('completedPaymentRequestId', completedPaymentRequestIds)

  const invoiceLines = await db.completedInvoiceLine(transaction ?? undefined)
    .whereIn('completedPaymentRequestId', completedPaymentRequestIds)
    .orderBy('completedInvoiceLineId', 'asc')

  return completedPaymentRequests
    .map(x => ({ ...x, invoiceLines: invoiceLines.filter(line => line.completedPaymentRequestId === x.completedPaymentRequestId) }))
    .map(removeNullProperties)
}

module.exports = {
  getPendingPaymentRequests
}
