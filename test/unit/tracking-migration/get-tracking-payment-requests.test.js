const db = require('../../../app/data')
const { getTrackingPaymentRequests } = require('../../../app/tracking-migration')

jest.mock('../../../app/data')

describe('getTrackingPaymentRequests', () => {
  let transaction

  beforeEach(() => {
    jest.clearAllMocks()

    transaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    }
    db.sequelize.transaction.mockResolvedValue(transaction)
    db.paymentRequest.findAll.mockReset()
    db.paymentRequest.update.mockReset()
    db.sequelize.query.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('retrieves and updates payment requests correctly', async () => {
    const mockSubqueryResult = [
      { paymentRequestId: 1 },
      { paymentRequestId: 2 }
    ]
    const mockPaymentRequests = [
      { paymentRequestId: 1, sentToTracking: false },
      { paymentRequestId: 2, sentToTracking: null }
    ]

    db.sequelize.query.mockResolvedValue(mockSubqueryResult)
    db.paymentRequest.findAll.mockResolvedValue(structuredClone(mockPaymentRequests))

    const limit = 10
    const result = await getTrackingPaymentRequests(limit)

    expect(db.sequelize.query).toHaveBeenCalledWith(
      `SELECT DISTINCT ON ("frn") "paymentRequestId"
       FROM "paymentRequests"
       WHERE ("sentToTracking" = false OR "sentToTracking" IS NULL)
       ORDER BY "frn", "paymentRequestId"
       LIMIT :limit`,
      {
        replacements: { limit },
        type: db.sequelize.QueryTypes.SELECT,
        transaction
      }
    )

    expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
      where: { paymentRequestId: { [db.Sequelize.Op.in]: [1, 2] } },
      include: [
        { model: db.completedPaymentRequest, as: 'completedPaymentRequests', required: false },
        { model: db.invoiceLine, as: 'invoiceLines', required: false }
      ],
      transaction
    })

    expect(db.paymentRequest.update).toHaveBeenCalledWith(
      { sentToTracking: true },
      { where: { paymentRequestId: [1, 2] }, transaction }
    )

    expect(transaction.commit).toHaveBeenCalled()
    expect(result).toEqual(mockPaymentRequests)
  })

  test('rolls back transaction if an error occurs', async () => {
    const error = new Error('Test error')
    db.sequelize.query.mockRejectedValue(error)

    await expect(getTrackingPaymentRequests(10)).rejects.toThrow('Test error')
    expect(transaction.rollback).toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  test('does not update if no payment requests are retrieved', async () => {
    const mockSubqueryResult = []
    const mockPaymentRequests = []

    db.sequelize.query.mockResolvedValue(mockSubqueryResult)
    db.paymentRequest.findAll.mockResolvedValue(structuredClone(mockPaymentRequests))

    const limit = 10
    const result = await getTrackingPaymentRequests(limit)

    expect(db.paymentRequest.update).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalled()
    expect(result).toEqual(mockPaymentRequests)
  })
})
