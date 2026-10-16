const db = require('../../app/database')

const tables = [
  'autoHoldCategories',
  'autoHolds',
  'completedInvoiceLines',
  'completedPaymentRequests',
  'frnAgreementClosed',
  'holdCategories',
  'holds',
  'invoiceLines',
  'metrics',
  'outbox',
  'paymentRequests',
  'schedule',
  'schemes'
]

const truncate = async () => {
  const quoted = tables.map(table => `"${table}"`).join(', ')
  await db.client.raw(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`)
}

module.exports = {
  truncate
}
