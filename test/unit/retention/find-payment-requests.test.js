const { findPaymentRequests } = require('../../../app/retention/find-payment-requests')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  paymentRequest: {
    findAll: jest.fn()
  }
}))

describe('findPaymentRequests', () => {
  const agreementNumber = 'AGR123'
  const frn = 456789
  const schemeId = 10
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.paymentRequest.findAll with agreementNumber in where when usesContractNumber is false', async () => {
    const mockResult = [
      { paymentRequestId: 201 },
      { paymentRequestId: 202 }
    ]
    db.paymentRequest.findAll.mockResolvedValue(mockResult)

    const result = await findPaymentRequests(agreementNumber, frn, schemeId, false, mockTransaction)

    expect(db.paymentRequest.findAll).toHaveBeenCalledTimes(1)
    expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
      attributes: ['paymentRequestId'],
      where: { agreementNumber, frn, schemeId },
      transaction: mockTransaction
    })
    expect(result).toBe(mockResult)
  })

  test('calls db.paymentRequest.findAll with contractNumber in where when usesContractNumber is true', async () => {
    const mockResult = [
      { paymentRequestId: 301 },
      { paymentRequestId: 302 }
    ]
    db.paymentRequest.findAll.mockResolvedValue(mockResult)

    const result = await findPaymentRequests(agreementNumber, frn, schemeId, true, mockTransaction)

    expect(db.paymentRequest.findAll).toHaveBeenCalledTimes(1)
    expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
      attributes: ['paymentRequestId'],
      where: { contractNumber: agreementNumber, frn, schemeId },
      transaction: mockTransaction
    })
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided, usesContractNumber false', async () => {
    const mockResult = []
    db.paymentRequest.findAll.mockResolvedValue(mockResult)

    const result = await findPaymentRequests(agreementNumber, frn, schemeId, false)

    expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
      attributes: ['paymentRequestId'],
      where: { agreementNumber, frn, schemeId },
      transaction: undefined
    })
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided, usesContractNumber true', async () => {
    const mockResult = []
    db.paymentRequest.findAll.mockResolvedValue(mockResult)

    const result = await findPaymentRequests(agreementNumber, frn, schemeId, true)

    expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
      attributes: ['paymentRequestId'],
      where: { contractNumber: agreementNumber, frn, schemeId },
      transaction: undefined
    })
    expect(result).toBe(mockResult)
  })

  test('propagates errors from db.paymentRequest.findAll', async () => {
    const error = new Error('DB failure')
    db.paymentRequest.findAll.mockRejectedValue(error)

    await expect(findPaymentRequests(agreementNumber, frn, schemeId, false, mockTransaction)).rejects.toThrow('DB failure')
  })
})
