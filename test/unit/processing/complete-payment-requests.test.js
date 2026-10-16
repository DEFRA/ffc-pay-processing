const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['schedule', 'completedPaymentRequest', 'completedInvoiceLine', 'outbox'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))
jest.mock('../../../app/event')
jest.mock('../../../app/helpers/sanitize-invoice-line')

const { completePaymentRequests } = require('../../../app/processing/complete-payment-requests')
const { sendZeroValueEvent } = require('../../../app/event')
const { sanitizeInvoiceLine } = require('../../../app/helpers/sanitize-invoice-line')

describe('completePaymentRequests', () => {
  let scheduleBuilder
  let completedPaymentRequestBuilder
  let completedInvoiceLineBuilder
  let outboxBuilder

  beforeEach(() => {
    jest.clearAllMocks()

    scheduleBuilder = createQueryBuilder().resolves(1)
    completedPaymentRequestBuilder = createQueryBuilder().resolves([{ completedPaymentRequestId: 1 }])
    completedInvoiceLineBuilder = createQueryBuilder().resolves()
    outboxBuilder = createQueryBuilder().resolves()

    mockDb.tables.schedule.mockReturnValue(scheduleBuilder)
    mockDb.tables.completedPaymentRequest.mockReturnValue(completedPaymentRequestBuilder)
    mockDb.tables.completedInvoiceLine.mockReturnValue(completedInvoiceLineBuilder)
    mockDb.tables.outbox.mockReturnValue(outboxBuilder)

    sendZeroValueEvent.mockResolvedValue()
    sanitizeInvoiceLine.mockImplementation(line => line)
  })

  test('should mark the schedule complete inside the transaction', async () => {
    await completePaymentRequests(1, [{ invoiceNumber: 'SITI1234', value: 100, invoiceLines: [{ value: 100 }] }])

    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.schedule).toHaveBeenCalledWith(mockDb.trx)
    expect(scheduleBuilder.where).toHaveBeenCalledWith({ scheduleId: 1 })
    expect(scheduleBuilder.whereNull).toHaveBeenCalledWith('completed')
    expect(scheduleBuilder.update).toHaveBeenCalledWith({ completed: expect.any(Date) })
  })

  test('should only insert completed payment request and invoice line columns', async () => {
    const paymentRequest = {
      paymentRequestId: 10,
      invoiceNumber: 'SITI1234',
      value: 100,
      scheme: { name: 'SFI' },
      invoiceLines: [{ invoiceLineId: 5, paymentRequestId: 10, value: 100, description: 'G00', invalid: false }]
    }

    await completePaymentRequests(1, [paymentRequest])

    const createdPayload = completedPaymentRequestBuilder.insert.mock.calls[0][0]
    expect(createdPayload).toEqual(expect.objectContaining({ paymentRequestId: 10, invoiceNumber: 'SITI1234', value: 100, invalid: false }))
    expect(createdPayload).not.toHaveProperty('scheme')
    expect(createdPayload).not.toHaveProperty('invoiceLines')
    expect(completedPaymentRequestBuilder.returning).toHaveBeenCalledWith('completedPaymentRequestId')

    const createdLine = completedInvoiceLineBuilder.insert.mock.calls[0][0]
    expect(createdLine).toEqual(expect.objectContaining({ completedPaymentRequestId: 1, value: 100, description: 'G00' }))
    expect(createdLine).not.toHaveProperty('invoiceLineId')
    expect(createdLine).not.toHaveProperty('paymentRequestId')
    expect(createdLine).not.toHaveProperty('invalid')

    expect(outboxBuilder.insert).toHaveBeenCalledWith({ completedPaymentRequestId: 1 })
  })

  test('should keep an explicit invalid value', async () => {
    await completePaymentRequests(1, [{ invoiceNumber: 'SITI1234', value: 100, invalid: true, invoiceLines: [{ value: 100 }] }])

    expect(completedPaymentRequestBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ invalid: true }))
  })

  test('should process single request with offsetting values', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      paymentRequestNumber: 1,
      value: 100,
      invoiceLines: [
        { value: 100 },
        { value: -100 }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(scheduleBuilder.update).toHaveBeenCalledTimes(1)
    expect(completedPaymentRequestBuilder.insert).toHaveBeenCalled()
    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(2)
    expect(outboxBuilder.insert).toHaveBeenCalled()
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should process multiple requests without offset', async () => {
    const requests = [
      {
        invoiceNumber: 'SITI1234',
        value: 100,
        invoiceLines: [{ value: 100 }]
      },
      {
        invoiceNumber: 'SITI5678',
        value: 200,
        invoiceLines: [{ value: 200 }]
      }
    ]

    await completePaymentRequests(1, requests)

    expect(scheduleBuilder.update).toHaveBeenCalledTimes(1)
    expect(completedPaymentRequestBuilder.insert).toHaveBeenCalledTimes(2)
    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(2)
    expect(outboxBuilder.insert).toHaveBeenCalledTimes(2)
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should handle transaction rollback on error', async () => {
    completedPaymentRequestBuilder.rejects(new Error('Test error'))

    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      value: 100,
      invoiceLines: [{ value: 100 }]
    }

    await expect(completePaymentRequests(1, [paymentRequest])).rejects.toThrow('Test error')
    expect(scheduleBuilder.update).toHaveBeenCalledTimes(1)
    expect(mockDb.trx.rollback).toHaveBeenCalled()
  })

  test('should create zero value event for zero value payment', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      value: 0,
      invoiceLines: [{ value: 0 }]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(scheduleBuilder.update).toHaveBeenCalledTimes(1)
    expect(sendZeroValueEvent).toHaveBeenCalled()
    expect(sanitizeInvoiceLine).not.toHaveBeenCalled()
    expect(outboxBuilder.insert).not.toHaveBeenCalled()
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should skip processing when schedule update affects zero rows', async () => {
    scheduleBuilder.resolves(0)

    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      value: 100,
      invoiceLines: [{ value: 100 }]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(scheduleBuilder.update).toHaveBeenCalledTimes(1)
    expect(completedPaymentRequestBuilder.insert).not.toHaveBeenCalled()
    expect(sanitizeInvoiceLine).not.toHaveBeenCalled()
    expect(outboxBuilder.insert).not.toHaveBeenCalled()
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should copy new fields to completedPaymentRequest when present', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI9999',
      paymentRequestNumber: 2,
      value: 123.45,
      claimDate: '2025-01-31',
      fesCode: 'FES-ABC',
      annualValue: '9999.99',
      remittanceDescription: 'Quarterly reconciliation',
      invoiceLines: [
        { value: 123.45 }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(completedPaymentRequestBuilder.insert).toHaveBeenCalledTimes(1)
    const createdPayload = completedPaymentRequestBuilder.insert.mock.calls[0][0]

    expect(createdPayload).toEqual(expect.objectContaining({
      invoiceNumber: 'SITI9999',
      paymentRequestNumber: 2,
      value: 123.45,
      claimDate: '2025-01-31',
      fesCode: 'FES-ABC',
      annualValue: '9999.99',
      remittanceDescription: 'Quarterly reconciliation'
    }))

    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(1)
    expect(outboxBuilder.insert).toHaveBeenCalledTimes(1)
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should not require new fields and still complete when they are absent', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI0001',
      paymentRequestNumber: 3,
      value: 50,
      invoiceLines: [
        { value: 50 }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(completedPaymentRequestBuilder.insert).toHaveBeenCalledTimes(1)
    const createdPayload = completedPaymentRequestBuilder.insert.mock.calls[0][0]

    expect(createdPayload.claimDate).toBeUndefined()
    expect(createdPayload.fesCode).toBeUndefined()
    expect(createdPayload.annualValue).toBeUndefined()
    expect(createdPayload.remittanceDescription).toBeUndefined()

    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(1)
    expect(outboxBuilder.insert).toHaveBeenCalledTimes(1)
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should include new fields even when payment value is zero (but still send zero value event)', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI0000',
      paymentRequestNumber: 4,
      value: 0,
      claimDate: '2025-02-15',
      fesCode: 'FES-ZERO',
      annualValue: '0.00',
      remittanceDescription: 'Zero-value adjustment',
      invoiceLines: [
        { value: 0 }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(sendZeroValueEvent).toHaveBeenCalledTimes(1)
    expect(sanitizeInvoiceLine).not.toHaveBeenCalled()
    expect(outboxBuilder.insert).not.toHaveBeenCalled()
    expect(mockDb.trx.commit).toHaveBeenCalled()

    expect(completedPaymentRequestBuilder.insert).toHaveBeenCalledTimes(1)
    const createdPayload = completedPaymentRequestBuilder.insert.mock.calls[0][0]
    expect(createdPayload).toEqual(expect.objectContaining({
      invoiceNumber: 'SITI0000',
      paymentRequestNumber: 4,
      value: 0,
      claimDate: '2025-02-15',
      fesCode: 'FES-ZERO',
      annualValue: '0.00',
      remittanceDescription: 'Zero-value adjustment'
    }))
  })

  test('should sanitize all non-zero invoice lines', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI1111',
      paymentRequestNumber: 1,
      value: 300,
      invoiceLines: [
        { value: 100, description: '100€' },
        { value: 200, description: '200€' }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(2)
    expect(sanitizeInvoiceLine).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ value: 100, description: '100€' })
    )
    expect(sanitizeInvoiceLine).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ value: 200, description: '200€' })
    )
  })

  test('should not sanitize zero-value invoice lines', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI2222',
      paymentRequestNumber: 1,
      value: 100,
      invoiceLines: [
        { value: 100, description: 'Non-zero€' },
        { value: 0, description: 'Zero€' }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(1)
    expect(sanitizeInvoiceLine).toHaveBeenCalledWith(
      expect.objectContaining({ value: 100, description: 'Non-zero€' })
    )
  })
})
