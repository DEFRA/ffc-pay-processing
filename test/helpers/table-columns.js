const sharedPaymentRequestColumns = [
  'schemeId',
  'sourceSystem',
  'batch',
  'deliveryBody',
  'invoiceNumber',
  'frn',
  'sbi',
  'vendor',
  'trader',
  'ledger',
  'marketingYear',
  'agreementNumber',
  'contractNumber',
  'paymentRequestNumber',
  'currency',
  'schedule',
  'dueDate',
  'debtType',
  'recoveryDate',
  'originalSettlementDate',
  'originalInvoiceNumber',
  'invoiceCorrectionReference',
  'value',
  'referenceId',
  'correlationId',
  'paymentType',
  'pillar',
  'exchangeRate',
  'eventDate',
  'claimDate',
  'fesCode',
  'annualValue',
  'remittanceDescription',
  'providesAccountingValues'
]

const sharedInvoiceLineColumns = [
  'schemeCode',
  'accountCode',
  'fundCode',
  'agreementNumber',
  'description',
  'value',
  'convergence',
  'deliveryBody',
  'marketingYear',
  'stateAid'
]

const columns = {
  paymentRequest: ['paymentRequestId', ...sharedPaymentRequestColumns, 'received'],
  invoiceLine: ['invoiceLineId', 'paymentRequestId', ...sharedInvoiceLineColumns, 'invalid'],
  completedPaymentRequest: ['completedPaymentRequestId', 'paymentRequestId', ...sharedPaymentRequestColumns, 'submitted', 'acknowledged', 'lastSettlement', 'settledValue', 'invalid'],
  completedInvoiceLine: ['completedInvoiceLineId', 'completedPaymentRequestId', ...sharedInvoiceLineColumns],
  schedule: ['scheduleId', 'paymentRequestId', 'planned', 'started', 'completed'],
  hold: ['holdId', 'holdCategoryId', 'frn', 'added', 'closed'],
  autoHold: ['autoHoldId', 'autoHoldCategoryId', 'frn', 'marketingYear', 'agreementNumber', 'contractNumber', 'added', 'closed']
}

const pickColumns = (table, values) => {
  return Object.fromEntries(columns[table].filter(column => values[column] !== undefined).map(column => [column, values[column]]))
}

module.exports = {
  pickColumns
}
