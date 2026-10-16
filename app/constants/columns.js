const TABLES = require('./tables')

const PRIMARY_KEYS = {
  [TABLES.autoHold]: 'autoHoldId',
  [TABLES.autoHoldCategory]: 'autoHoldCategoryId',
  [TABLES.completedInvoiceLine]: 'completedInvoiceLineId',
  [TABLES.completedPaymentRequest]: 'completedPaymentRequestId',
  [TABLES.frnAgreementClosed]: 'closedId',
  [TABLES.hold]: 'holdId',
  [TABLES.holdCategory]: 'holdCategoryId',
  [TABLES.invoiceLine]: 'invoiceLineId',
  [TABLES.outbox]: 'outboxId',
  [TABLES.paymentRequest]: 'paymentRequestId',
  [TABLES.schedule]: 'scheduleId'
}

const COLUMNS = {
  [TABLES.autoHold]: [
    'autoHoldId',
    'frn',
    'autoHoldCategoryId',
    'marketingYear',
    'added',
    'closed',
    'migrated',
    'migrationId',
    'agreementNumber',
    'contractNumber'
  ],
  [TABLES.autoHoldCategory]: [
    'autoHoldCategoryId',
    'schemeId',
    'name'
  ],
  [TABLES.completedInvoiceLine]: [
    'completedInvoiceLineId',
    'completedPaymentRequestId',
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
  ],
  [TABLES.completedPaymentRequest]: [
    'completedPaymentRequestId',
    'paymentRequestId',
    'schemeId',
    'batch',
    'ledger',
    'sourceSystem',
    'deliveryBody',
    'invoiceNumber',
    'frn',
    'sbi',
    'vendor',
    'trader',
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
    'submitted',
    'acknowledged',
    'lastSettlement',
    'settledValue',
    'invalid',
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
  ],
  [TABLES.frnAgreementClosed]: [
    'closedId',
    'schemeId',
    'frn',
    'agreementNumber',
    'closureDate'
  ],
  [TABLES.hold]: [
    'holdId',
    'frn',
    'holdCategoryId',
    'added',
    'closed',
    'migrated',
    'migrationId'
  ],
  [TABLES.holdCategory]: [
    'holdCategoryId',
    'schemeId',
    'name'
  ],
  [TABLES.invoiceLine]: [
    'invoiceLineId',
    'paymentRequestId',
    'schemeCode',
    'accountCode',
    'fundCode',
    'agreementNumber',
    'description',
    'value',
    'convergence',
    'deliveryBody',
    'marketingYear',
    'stateAid',
    'invalid'
  ],
  [TABLES.metric]: [
    'id',
    'snapshot_date',
    'period_type',
    'scheme_name',
    'scheme_year',
    'total_payments',
    'total_value',
    'pending_payments',
    'pending_value',
    'processed_payments',
    'processed_value',
    'settled_payments',
    'settled_value',
    'payments_on_hold',
    'value_on_hold',
    'calculated_at',
    'data_start_date',
    'data_end_date',
    'month_in_year'
  ],
  [TABLES.outbox]: [
    'outboxId',
    'completedPaymentRequestId',
    'submitted'
  ],
  [TABLES.paymentRequest]: [
    'paymentRequestId',
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
    'received',
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
  ],
  [TABLES.schedule]: [
    'scheduleId',
    'paymentRequestId',
    'planned',
    'started',
    'completed'
  ],
  [TABLES.scheme]: [
    'schemeId',
    'name',
    'active'
  ]
}

const pickColumns = (record, table) => {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([column]) => COLUMNS[table].includes(column))
      .filter(([column]) => column !== PRIMARY_KEYS[table])
  )
}

module.exports = {
  PRIMARY_KEYS,
  COLUMNS,
  pickColumns
}
