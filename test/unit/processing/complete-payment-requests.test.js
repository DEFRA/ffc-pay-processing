const db = require('../../../app/data')
const {
  completePaymentRequests
} = require('../../../app/processing/complete-payment-requests')
const { sendZeroValueEvent } = require('../../../app/event')

jest.mock('../../../app/data')
jest.mock('../../../app/event')

describe('complete payment requests', () => {
  let mockTransaction

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    }

    db.sequelize.transaction.mockResolvedValue(mockTransaction)

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
        Promise.resolve({
          completedPaymentRequestId: 1,
          ...data
        })
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

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should process single request with offsetting values', async () => {
    const paymentRequest = {
      dataValues: {
        invoiceNumber: 'SITI1234',
        value: 100,
        paymentRequestNumber: 1,
        invoiceLines: [
          { dataValues: { value: 100 } },
          { dataValues: { value: -100 } }
        ]
      },
      invoiceNumber: 'SITI1234',
      value: 100,
      paymentRequestNumber: 1,
      invoiceLines: [
        { dataValues: { value: 100 }, value: 100 },
        { dataValues: { value: -100 }, value: -100 }
      ]
    }

    await completePaymentRequests(1, [paymentRequest])

    expect(db.completedPaymentRequest.create).toHaveBeenCalled()
    expect(db.outbox.create).toHaveBeenCalled()
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  test('should process multiple requests without offset', async () => {
    const requests = [
      {
        dataValues: {
          invoiceNumber: 'SITI1234',
          value: 100,
          invoiceLines: [{ dataValues: { value: 100 } }]
        },
        invoiceNumber: 'SITI1234',
        value: 100,
        invoiceLines: [{ dataValues: { value: 100 }, value: 100 }]
      },
      {
        dataValues: {
          invoiceNumber: 'SITI5678',
          value: 200,
          invoiceLines: [{ dataValues: { value: 200 } }]
        },
        invoiceNumber: 'SITI5678',
        value: 200,
        invoiceLines: [{ dataValues: { value: 200 }, value: 200 }]
      }
    ]

    await completePaymentRequests(1, requests)

    expect(db.completedPaymentRequest.create).toHaveBeenCalledTimes(2)
    expect(db.outbox.create).toHaveBeenCalledTimes(2)
  })

  test('should handle transaction rollback on error', async () => {
    db.completedPaymentRequest.create.mockRejectedValue(new Error('Test error'))

    const paymentRequest = {
      dataValues: {
        invoiceNumber: 'SITI1234',
        value: 100,
        invoiceLines: [{ dataValues: { value: 100 } }]
      },
      invoiceNumber: 'SITI1234',
      value: 100,
      invoiceLines: [{ dataValues: { value: 100 }, value: 100 }]
    }

    await expect(completePaymentRequests(1, [paymentRequest])).rejects.toThrow(
      'Test error'
    )
    expect(mockTransaction.rollback).toHaveBeenCalled()
  })

  test('should create zero value event for zero value payment', async () => {
    const paymentRequest = {
      dataValues: {
        invoiceNumber: 'SITI1234',
        value: 0,
        invoiceLines: [{ dataValues: { value: 0 } }]
      },
      invoiceNumber: 'SITI1234',
      value: 0,
      invoiceLines: [{ dataValues: { value: 0 }, value: 0 }]
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
})
