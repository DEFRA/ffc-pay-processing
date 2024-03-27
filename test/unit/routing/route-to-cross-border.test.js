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

const { CROSS_BORDER } = require('../../../app/constants/messages')

const { messageConfig } = require('../../../app/config')

const { routeToCrossBorder } = require('../../../app/routing/route-to-cross-border')
const { CROSS_BORDER: CROSS_BORDER_NAME } = require('../../../app/constants/hold-categories-names')

const holdCategoryId = 1

describe('route to cross border', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetHoldCategoryId.mockResolvedValue(holdCategoryId)
  })

  test('should send payment request to Cross Border', async () => {
    await routeToCrossBorder(paymentRequest)
    expect(mockSendMessage).toHaveBeenCalledWith(paymentRequest, CROSS_BORDER, messageConfig.xbTopic)
  })

  test('should get debt enrichment hold category id', async () => {
    await routeToCrossBorder(paymentRequest)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, CROSS_BORDER_NAME, mockTransactionObject)
  })

  test('should hold and reschedule payment request', async () => {
    await routeToCrossBorder(paymentRequest)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(paymentRequest.paymentRequestId, holdCategoryId, paymentRequest.frn, paymentRequest.marketingYear, mockTransactionObject)
  })

  test('should commit transaction', async () => {
    await routeToCrossBorder(paymentRequest)
    expect(mockCommit).toHaveBeenCalled()
  })

  test('should rollback transaction if error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('Test error'))
    await expect(routeToCrossBorder(paymentRequest)).rejects.toThrow('Test error')
    expect(mockRollback).toHaveBeenCalled()
  })
})
