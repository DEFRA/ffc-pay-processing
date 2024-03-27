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

const { ROUTED_LEDGER } = require('../../../app/constants/messages')
const { AWAITING_LEDGER_CHECK } = require('../../../app/constants/hold-categories-names')

const { messageConfig } = require('../../../app/config')

const { routeManualLedgerToRequestEditor } = require('../../../app/routing/route-manual-ledger-to-request-editor')

const holdCategoryId = 1
const deltaCalculationResult = { deltaPaymentRequest: paymentRequest, completedPaymentRequests: [paymentRequest] }

describe('route debt to request editor', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetHoldCategoryId.mockResolvedValue(holdCategoryId)
  })

  test('should send payment request to Request Editor', async () => {
    await routeManualLedgerToRequestEditor(deltaCalculationResult)
    expect(mockSendMessage).toHaveBeenCalledWith({ paymentRequest, paymentRequests: [paymentRequest] }, ROUTED_LEDGER, messageConfig.manualTopic)
  })

  test('should get debt enrichment hold category id', async () => {
    await routeManualLedgerToRequestEditor(deltaCalculationResult)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, AWAITING_LEDGER_CHECK, mockTransactionObject)
  })

  test('should hold and reschedule payment request', async () => {
    await routeManualLedgerToRequestEditor(deltaCalculationResult)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(paymentRequest.paymentRequestId, holdCategoryId, paymentRequest.frn, paymentRequest.marketingYear, mockTransactionObject)
  })

  test('should commit transaction', async () => {
    await routeManualLedgerToRequestEditor(deltaCalculationResult)
    expect(mockCommit).toHaveBeenCalled()
  })

  test('should rollback transaction if error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('Test error'))
    await expect(routeManualLedgerToRequestEditor(deltaCalculationResult)).rejects.toThrow('Test error')
    expect(mockRollback).toHaveBeenCalled()
  })
})
