const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')
const db = require('../../../../app/data')

jest.mock('../../../../app/routing/get-schedule-id')
const { getScheduleId: mockGetScheduleId } = require('../../../../app/routing/get-schedule-id')

jest.mock('../../../../app/routing/transform-payment-request')
const { transformPaymentRequest: mockTransformPaymentRequest } = require('../../../../app/routing/transform-payment-request')

jest.mock('../../../../app/processing/account-codes')
const { mapAccountCodes: mockMapAccountCodes } = require('../../../../app/processing/account-codes')

jest.mock('../../../../app/processing/complete-payment-requests')
const { completePaymentRequests: mockCompletePaymentRequests } = require('../../../../app/processing/complete-payment-requests')

jest.mock('../../../../app/auto-hold')
const { removeAutoHold: mockRemoveAutoHold } = require('../../../../app/auto-hold')

jest.mock('../../../../app/event')
const { sendProcessingRouteEvent: mockSendProcessingRouteEvent } = require('../../../../app/event')

const schedule = require('../../../mocks/schedules/in-progress')

const { AWAITING_LEDGER_CHECK } = require('../../../../app/constants/hold-categories-names')

const { updateRequestsAwaitingManualLedgerCheck } = require('../../../../app/routing/update-requests-awaiting-manual-ledger-check')

let paymentRequest
let manualLedgerCheckResult

describe('update requests awaiting manual ledger check', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
        try {
      await resetDatabase()
    } catch (error) {
      console.error({
        message: error.message,
        name: error.name,
        parentMessage: error.parent?.message,
        originalMessage: error.original?.message,
        detail: error.parent?.detail,
        constraint: error.parent?.constraint,
        table: error.parent?.table
      })

      throw error
    }

    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
    schedule.scheduleId = 1
    manualLedgerCheckResult = { paymentRequest, paymentRequests: [paymentRequest, paymentRequest] }

    mockGetScheduleId.mockResolvedValue(schedule)
    mockTransformPaymentRequest.mockResolvedValue([paymentRequest, paymentRequest])
  })

  test('should throw error if original payment request is not found', async () => {
    await expect(updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)).rejects.toThrow('No payment request matching invoice number')
  })

  test('should get schedule associated with matched payment request', async () => {
    const { id: paymentRequestId } = await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockGetScheduleId).toHaveBeenCalledWith(paymentRequestId)
  })

  test('should transform payment request if payment request has outstanding schedule', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockTransformPaymentRequest).toHaveBeenCalledWith(paymentRequest, [paymentRequest, paymentRequest])
  })

  test('should not transform payment request if payment request does not have outstanding schedule', async () => {
    mockGetScheduleId.mockResolvedValue(null)
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockTransformPaymentRequest).not.toHaveBeenCalled()
  })

  test('should map account codes if payment request has outstanding schedule', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockMapAccountCodes).toHaveBeenCalledWith(paymentRequest)
  })

  test('should map account codes for each ledger payment request if payment request has outstanding schedule', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockMapAccountCodes).toHaveBeenCalledTimes(2)
  })

  test('should not map account codes if payment request does not have outstanding schedule', async () => {
    mockGetScheduleId.mockResolvedValue(null)
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockMapAccountCodes).not.toHaveBeenCalled()
  })

  test('should complete payment requests if payment request has outstanding schedule', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockCompletePaymentRequests).toHaveBeenCalledWith(schedule.scheduleId, [paymentRequest, paymentRequest])
  })

  test('should update correlation id to match original payment request when completing payment request', async () => {
    const originalCorrelationId = paymentRequest.correlationId
    await savePaymentRequest(paymentRequest)
    delete paymentRequest.correlationId
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockCompletePaymentRequests.mock.calls[0][1][0].correlationId).toEqual(originalCorrelationId)
  })

  test('should update payment request id to match original payment request when completing payment request', async () => {
    const { id: paymentRequestId } = await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockCompletePaymentRequests.mock.calls[0][1][0].paymentRequestId).toEqual(paymentRequestId)
  })

  test('should not complete payment requests if payment request does not have outstanding schedule', async () => {
    mockGetScheduleId.mockResolvedValue(null)
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockCompletePaymentRequests).not.toHaveBeenCalled()
  })

  test('should remove manual ledger hold for scheme if payment request has outstanding schedule', async () => {
    const { id } = await savePaymentRequest(paymentRequest)
    const mockCheckPaymentRequest = await db.paymentRequest.findOne({ where: { paymentRequestId: id } })
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockRemoveAutoHold).toHaveBeenCalledWith(mockCheckPaymentRequest, AWAITING_LEDGER_CHECK)
  })

  test('should not remove manual ledger hold for scheme if payment request does not have outstanding schedule', async () => {
    mockGetScheduleId.mockResolvedValue(null)
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockRemoveAutoHold).not.toHaveBeenCalled()
  })

  test('should send processing route event if payment request has outstanding schedule', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockSendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'manual-ledger', 'response')
  })

  test('should send processing route event for each ledger payment request if payment request has outstanding schedule', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockSendProcessingRouteEvent).toHaveBeenCalledTimes(2)
  })

  test('should not send processing route event if payment request does not have outstanding schedule', async () => {
    mockGetScheduleId.mockResolvedValue(null)
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingManualLedgerCheck(manualLedgerCheckResult)
    expect(mockSendProcessingRouteEvent).not.toHaveBeenCalled()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
