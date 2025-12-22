const db = require('../../../app/data')
const { completePaymentRequests } = require('../../../app/processing/complete-payment-requests')
const { sendZeroValueEvent } = require('../../../app/event')

jest.mock('../../../app/data')
jest.mock('../../../app/event')

describe('completePaymentRequests', () => {
  let mockTransaction

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock transaction
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    }
    db.sequelize.transaction.mockResolvedValue(mockTransaction)

    // Mock database models
    db.schedule = {
      findByPk: jest.fn().mockResolvedValue({
        scheduleId: 1,
        completed: null,
        active: true
      }),
      update: jest.fn().mockResolvedValue([1])
    }

    db.completedPaymentRequest = {
      create: jest.fn().mockImplementation(data =>
        Promise.resolve({ completedPaymentRequestId: 1, ...data })
      )
    }

    db.completedInvoiceLine = {
      create: jest.fn().mockResolvedValue({ invoiceLineId: 1 })
    }

    db.outbox = {
      create: jest.fn().mockResolvedValue({ outboxId: 1 })
    }

    sendZeroValueEvent.mockResolvedValue()
  })

  test('should process single request with offsetting values', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      paymentRequestNumber: 1,
      value: 100,
      invoiceLines: [
        { value: 100, dataValues: { value: 100 } },
        { value: -100, dataValues: { value: -100 } }
      ],
      dataValues: {
        invoiceNumber: 'SITI1234',
        value: 100,
        paymentRequestNumber: 1,
        invoiceLines: [
          { value: 100, dataValues: { value: 100 } },
          { value: -100, dataValues: { value: -100 } }
        ]
      }
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(db.completedPaymentRequest.create).toHaveBeenCalled()
    expect(db.outbox.create).toHaveBeenCalled()
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  test('should process multiple requests without offset', async () => {
    const requests = [
      {
        invoiceNumber: 'SITI1234',
        value: 100,
        invoiceLines: [{ value: 100, dataValues: { value: 100 } }],
        dataValues: { invoiceNumber: 'SITI1234', value: 100, invoiceLines: [{ value: 100 }] }
      },
      {
        invoiceNumber: 'SITI5678',
        value: 200,
        invoiceLines: [{ value: 200, dataValues: { value: 200 } }],
        dataValues: { invoiceNumber: 'SITI5678', value: 200, invoiceLines: [{ value: 200 }] }
      }
    ]

    await completePaymentRequests(1, requests)

    expect(db.completedPaymentRequest.create).toHaveBeenCalledTimes(2)
    expect(db.outbox.create).toHaveBeenCalledTimes(2)
  })

  test('should handle transaction rollback on error', async () => {
    db.completedPaymentRequest.create.mockRejectedValue(new Error('Test error'))

    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      value: 100,
      invoiceLines: [{ value: 100, dataValues: { value: 100 } }],
      dataValues: { invoiceNumber: 'SITI1234', value: 100, invoiceLines: [{ value: 100 }] }
    }

    await expect(completePaymentRequests(1, [paymentRequest])).rejects.toThrow('Test error')
    expect(mockTransaction.rollback).toHaveBeenCalled()
  })

  test('should create zero value event for zero value payment', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI1234',
      value: 0,
      invoiceLines: [{ value: 0, dataValues: { value: 0 } }],
      dataValues: { invoiceNumber: 'SITI1234', value: 0, invoiceLines: [{ value: 0 }] }
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(sendZeroValueEvent).toHaveBeenCalled()
    expect(db.outbox.create).not.toHaveBeenCalled()
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  test('should not process if schedule is completed', async () => {
    db.schedule.findByPk.mockResolvedValue({
      scheduleId: 1,
      completed: new Date(),
      active: true
    })

    await completePaymentRequests(1, [])

    expect(db.completedPaymentRequest.create).not.toHaveBeenCalled()
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  test('should copy new fields to completedPaymentRequest when present', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI9999',
      paymentRequestNumber: 2,
      value: 123.45,
      claimDate: '2025-01-31',
      fesCode: 'FES-ABC',
      annualValue: '9999.99',
      remmittanceDescription: 'Quarterly reconciliation',
      invoiceLines: [
        { value: 123.45, dataValues: { value: 123.45 } }
      ],
      dataValues: {
        invoiceNumber: 'SITI9999',
        paymentRequestNumber: 2,
        value: 123.45,
        claimDate: '2025-01-31',
        fesCode: 'FES-ABC',
        annualValue: '9999.99',
        remmittanceDescription: 'Quarterly reconciliation',
        invoiceLines: [{ value: 123.45 }]
      }
    }

    await completePaymentRequests(1, [paymentRequest])

    // Capture the payload used to persist the completed payment request
    expect(db.completedPaymentRequest.create).toHaveBeenCalledTimes(1)
    const createdPayload = db.completedPaymentRequest.create.mock.calls[0][0]

    // Ensure core fields still present
    expect(createdPayload).toEqual(expect.objectContaining({
      invoiceNumber: 'SITI9999',
      paymentRequestNumber: 2,
      value: 123.45
    }))

    // Ensure the new fields are mapped through
    expect(createdPayload).toEqual(expect.objectContaining({
      claimDate: '2025-01-31',
      fesCode: 'FES-ABC',
      annualValue: '9999.99',
      remmittanceDescription: 'Quarterly reconciliation'
    }))

    // Transaction should still commit and an outbox entry should be created for non-zero payments
    expect(db.outbox.create).toHaveBeenCalledTimes(1)
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  test('should not require new fields and still complete when they are absent', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI0001',
      paymentRequestNumber: 3,
      value: 50,
      // No claimDate, fesCode, annualValue, remmittanceDescription
      invoiceLines: [
        { value: 50, dataValues: { value: 50 } }
      ],
      dataValues: {
        invoiceNumber: 'SITI0001',
        paymentRequestNumber: 3,
        value: 50,
        invoiceLines: [{ value: 50 }]
      }
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(db.completedPaymentRequest.create).toHaveBeenCalledTimes(1)
    const createdPayload = db.completedPaymentRequest.create.mock.calls[0][0]

    // Verify the new fields are either undefined or not present on payload
    expect(createdPayload.claimDate).toBeUndefined()
    expect(createdPayload.fesCode).toBeUndefined()
    expect(createdPayload.annualValue).toBeUndefined()
    expect(createdPayload.remmittanceDescription).toBeUndefined()

    // Still creates outbox and commits for non-zero payment
    expect(db.outbox.create).toHaveBeenCalledTimes(1)
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  test('should include new fields even when payment value is zero (but still send zero value event)', async () => {
    const paymentRequest = {
      invoiceNumber: 'SITI0000',
      paymentRequestNumber: 4,
      value: 0,
      claimDate: '2025-02-15',
      fesCode: 'FES-ZERO',
      annualValue: '0.00',
      remmittanceDescription: 'Zero-value adjustment',
      invoiceLines: [
        { value: 0, dataValues: { value: 0 } }
      ],
      dataValues: {
        invoiceNumber: 'SITI0000',
        paymentRequestNumber: 4,
        value: 0,
        claimDate: '2025-02-15',
        fesCode: 'FES-ZERO',
        annualValue: '0.00',
        remmittanceDescription: 'Zero-value adjustment',
        invoiceLines: [{ value: 0 }]
      }
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(sendZeroValueEvent).toHaveBeenCalledTimes(1)
    expect(db.outbox.create).not.toHaveBeenCalled()
    expect(mockTransaction.commit).toHaveBeenCalled()

    expect(db.completedPaymentRequest.create).toHaveBeenCalledTimes(1)
    const createdPayload = db.completedPaymentRequest.create.mock.calls[0][0]
    expect(createdPayload).toEqual(expect.objectContaining({
      invoiceNumber: 'SITI0000',
      paymentRequestNumber: 4,
      value: 0,
      claimDate: '2025-02-15',
      fesCode: 'FES-ZERO',
      annualValue: '0.00',
      remmittanceDescription: 'Zero-value adjustment'
    }))
  })
})
