const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

jest.mock('../../../../app/remove-null-properties')
const { removeNullProperties: mockRemoveNullProperties } = require('../../../../app/remove-null-properties')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/database')

const { getPendingPaymentRequests } = require('../../../../app/outbound/get-pending-payment-requests')

describe('get pending payment requests', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockRemoveNullProperties.mockReturnValue(paymentRequest)
    await resetDatabase()
    await savePaymentRequest(paymentRequest, true)
  })

  test('should return pending payment requests', async () => {
    const pendingPaymentRequests = await getPendingPaymentRequests()
    expect(pendingPaymentRequests.length).toBe(1)
  })

  test('should return payment request with all invoice lines', async () => {
    const pendingPaymentRequests = await getPendingPaymentRequests()
    expect(pendingPaymentRequests[0].invoiceLines.length).toBe(paymentRequest.invoiceLines.length)
  })

  test('should remove null properties from payment request', async () => {
    await getPendingPaymentRequests()
    expect(mockRemoveNullProperties).toHaveBeenCalledTimes(1)
  })

  test('should not return payment requests already submitted', async () => {
    await db.completedPaymentRequest().where({ submitted: null }).update({ submitted: new Date() })
    const pendingPaymentRequests = await getPendingPaymentRequests()
    expect(pendingPaymentRequests.length).toBe(0)
  })

  test('should not return payment requests with submitted outbox entry', async () => {
    await db.outbox().whereNull('submitted').update({ submitted: new Date() })
    const pendingPaymentRequests = await getPendingPaymentRequests()
    expect(pendingPaymentRequests.length).toBe(0)
  })

  test('should skip payment requests locked by another transaction', async () => {
    const lockingTransaction = await db.transaction()
    try {
      const lockedPaymentRequests = await getPendingPaymentRequests(lockingTransaction)
      expect(lockedPaymentRequests.length).toBe(1)

      const transaction = await db.transaction()
      const pendingPaymentRequests = await getPendingPaymentRequests(transaction)
      await transaction.commit()
      expect(pendingPaymentRequests.length).toBe(0)
    } finally {
      await lockingTransaction.rollback()
    }
  })

  test('should return payment requests again once the lock is released', async () => {
    const lockingTransaction = await db.transaction()
    await getPendingPaymentRequests(lockingTransaction)
    await lockingTransaction.rollback()

    const transaction = await db.transaction()
    const pendingPaymentRequests = await getPendingPaymentRequests(transaction)
    await transaction.commit()
    expect(pendingPaymentRequests.length).toBe(1)
  })

  test('should not return payment requests without invoice lines', async () => {
    await db.completedInvoiceLine().where({}).del()
    const pendingPaymentRequests = await getPendingPaymentRequests()
    expect(pendingPaymentRequests.length).toBe(0)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
