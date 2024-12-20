const mockCommit = jest.fn()
const mockRollback = jest.fn()
const mockTransactionObject = {
  commit: mockCommit,
  rollback: mockRollback
}
const mockTransaction = jest.fn().mockImplementation(() => {
  return mockTransactionObject
})

jest.mock('../../../app/data', () => {
  return {
    sequelize: {
      transaction: mockTransaction
    }
  }
})

jest.mock('../../../app/reset')
const { resetPaymentRequestById: mockResetPaymentRequestById } = require('../../../app/reset')

jest.mock('../../../app/acknowledgement/get-hold-category-name')
const { getHoldCategoryName: mockGetHoldCategoryName } = require('../../../app/acknowledgement/get-hold-category-name')

jest.mock('../../../app/holds')
const { getHoldCategoryId: mockGetHoldCategoryId } = require('../../../app/holds')

jest.mock('../../../app/reschedule')
const { holdAndReschedule: mockHoldAndReschedule } = require('../../../app/reschedule')

jest.mock('../../../app/event')
const { sendAcknowledgementErrorEvent: mockSendAcknowledgementErrorEvent } = require('../../../app/event')

const acknowledgement = require('../../mocks/acknowledgement')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

const { processInvalid } = require('../../../app/acknowledgement/process-invalid')

describe('process invalid acknowledgements', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetHoldCategoryName.mockReturnValue('DAX_REJECTION')
    mockGetHoldCategoryId.mockResolvedValue(1)
  })

  test('should create new database transaction', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  test('should reset payment request by id in transaction scope', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockResetPaymentRequestById).toHaveBeenCalledWith(paymentRequest.paymentRequestId, mockTransactionObject)
  })

  test('should get hold category name from acknowledgement message', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockGetHoldCategoryName).toHaveBeenCalledWith(acknowledgement.message)
  })

  test('should get hold category id from scheme id and hold category name', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, 'DAX_REJECTION', mockTransactionObject)
  })

  test('should hold and reschedule payment request', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(paymentRequest.paymentRequestId, 1, paymentRequest.frn, mockTransactionObject)
  })

  test('should send acknowledgement error event', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockSendAcknowledgementErrorEvent).toHaveBeenCalledWith('DAX_REJECTION', acknowledgement, paymentRequest)
  })

  test('should commit transaction', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockCommit).toHaveBeenCalledTimes(1)
  })

  test('should rollback transaction on error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('test error'))
    await expect(processInvalid(paymentRequest, acknowledgement)).rejects.toThrow('test error')
    expect(mockRollback).toHaveBeenCalledTimes(1)
  })

  test('should throw error on error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('test error'))
    await expect(processInvalid(paymentRequest, acknowledgement)).rejects.toThrow('test error')
  })
})
