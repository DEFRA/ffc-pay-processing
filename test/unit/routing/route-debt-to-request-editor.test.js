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

jest.mock('../../../app/messaging/send-message')
const { sendMessage: mockSendMessage } = require('../../../app/messaging/send-message')

jest.mock('../../../app/auto-hold')
const { getHoldCategoryId: mockGetHoldCategoryId } = require('../../../app/auto-hold')
const { holdAndReschedule: mockHoldAndReschedule } = require('../../../app/auto-hold')

const paymentRequest = require('../../mocks/payment-requests/payment-request')

const { ROUTED_DEBT } = require('../../../app/constants/messages')

const { messageConfig } = require('../../../app/config')

const { routeDebtToRequestEditor } = require('../../../app/routing/route-debt-to-request-editor')
const { AWAITING_DEBT_ENRICHMENT } = require('../../../app/constants/hold-categories-names')

const holdCategoryId = 1

describe('route debt to request editor', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetHoldCategoryId.mockResolvedValue(holdCategoryId)
  })

  test('should send payment request to Request Editor', async () => {
    await routeDebtToRequestEditor(paymentRequest)
    expect(mockSendMessage).toHaveBeenCalledWith(paymentRequest, ROUTED_DEBT, messageConfig.debtTopic)
  })

  test('should get debt enrichment hold category id', async () => {
    await routeDebtToRequestEditor(paymentRequest)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, AWAITING_DEBT_ENRICHMENT, mockTransactionObject)
  })

  test('should hold and reschedule payment request', async () => {
    await routeDebtToRequestEditor(paymentRequest)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(paymentRequest.paymentRequestId, holdCategoryId, paymentRequest.frn, paymentRequest.marketingYear, mockTransactionObject)
  })

  test('should commit transaction', async () => {
    await routeDebtToRequestEditor(paymentRequest)
    expect(mockCommit).toHaveBeenCalled()
  })

  test('should rollback transaction if error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('Test error'))
    await expect(routeDebtToRequestEditor(paymentRequest)).rejects.toThrow('Test error')
    expect(mockRollback).toHaveBeenCalled()
  })
})
