const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock()

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close
}))

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
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, AWAITING_LEDGER_CHECK, mockDb.trx)
  })

  test('should hold and reschedule payment request', async () => {
    await routeManualLedgerToRequestEditor(deltaCalculationResult)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(paymentRequest, holdCategoryId, mockDb.trx)
  })

  test('should commit transaction', async () => {
    await routeManualLedgerToRequestEditor(deltaCalculationResult)
    expect(mockDb.trx.commit).toHaveBeenCalled()
  })

  test('should rollback transaction if error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('Test error'))
    await expect(routeManualLedgerToRequestEditor(deltaCalculationResult)).rejects.toThrow('Test error')
    expect(mockDb.trx.rollback).toHaveBeenCalled()
  })
})
