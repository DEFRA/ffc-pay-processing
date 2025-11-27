const mockCommit = jest.fn()
const mockRollback = jest.fn()
const mockTx = { commit: mockCommit, rollback: mockRollback }
const mockTransaction = jest.fn(() => mockTx)

jest.mock('../../../app/data', () => ({
  sequelize: { transaction: mockTransaction }
}))

jest.mock('../../../app/reset')
const { resetPaymentRequestById: mockResetPaymentRequestById } = require('../../../app/reset')

jest.mock('../../../app/acknowledgement/get-hold-category-name')
const { getHoldCategoryName: mockGetHoldCategoryName } = require('../../../app/acknowledgement/get-hold-category-name')

jest.mock('../../../app/holds')
const { getHoldCategoryId: mockGetHoldCategoryId } = require('../../../app/holds')

jest.mock('../../../app/reschedule')
const { holdAndReschedule: mockHoldAndReschedule } = require('../../../app/reschedule')

jest.mock('../../../app/event')
const { sendAcknowledgementErrorEvent: mockSendAckErrEvent } = require('../../../app/event')

const acknowledgement = require('../../mocks/acknowledgement')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

const { processInvalid } = require('../../../app/acknowledgement/process-invalid')

describe('process invalid acknowledgements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHoldCategoryName.mockReturnValue('DAX_REJECTION')
    mockGetHoldCategoryId.mockResolvedValue(1)
  })

  test('creates transaction', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  test('resets payment request in transaction', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockResetPaymentRequestById)
      .toHaveBeenCalledWith(paymentRequest.paymentRequestId, mockTx)
  })

  test('gets hold category name from message', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockGetHoldCategoryName)
      .toHaveBeenCalledWith(acknowledgement.message)
  })

  test('gets hold category id', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockGetHoldCategoryId)
      .toHaveBeenCalledWith(paymentRequest.schemeId, 'DAX_REJECTION', mockTx)
  })

  test('holds and reschedules payment request', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockHoldAndReschedule)
      .toHaveBeenCalledWith(paymentRequest.paymentRequestId, 1, paymentRequest.frn, mockTx)
  })

  test('sends acknowledgement error event', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockSendAckErrEvent)
      .toHaveBeenCalledWith('DAX_REJECTION', acknowledgement, paymentRequest)
  })

  test('commits transaction', async () => {
    await processInvalid(paymentRequest, acknowledgement)
    expect(mockCommit).toHaveBeenCalledTimes(1)
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockHoldAndReschedule.mockRejectedValue(new Error('test error'))
    })

    test('rolls back transaction', async () => {
      await expect(processInvalid(paymentRequest, acknowledgement))
        .rejects.toThrow('test error')
      expect(mockRollback).toHaveBeenCalledTimes(1)
    })

    test('rethrows error', async () => {
      await expect(processInvalid(paymentRequest, acknowledgement))
        .rejects.toThrow('test error')
    })
  })
})
