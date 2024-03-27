jest.mock('../../../app/processing/transform-payment-request')
const { transformPaymentRequest: mockTransformPaymentRequest } = require('../../../app/processing/transform-payment-request')

jest.mock('../../../app/auto-hold/apply-auto-hold')
const { applyAutoHold: mockApplyAutoHold } = require('../../../app/auto-hold')

jest.mock('../../../app/processing/requires-debt-data')
const { requiresDebtData: mockRequiresDebtData } = require('../../../app/processing/requires-debt-data')

jest.mock('../../../app/processing/is-cross-border')
const { isCrossBorder: mockIsCrossBorder } = require('../../../app/processing/is-cross-border')

jest.mock('../../../app/routing')
const { routeDebtToRequestEditor: mockRouteDebtToRequestEditor, routeManualLedgerToRequestEditor: mockRouteManualLedgerToRequestEditor, routeToCrossBorder: mockRouteToCrossBorder } = require('../../../app/routing')

jest.mock('../../../app/processing/requires-manual-ledger-check')
const { requiresManualLedgerCheck: mockRequiresManualLedgerCheck } = require('../../../app/processing/requires-manual-ledger-check')

jest.mock('../../../app/processing/account-codes')
const { mapAccountCodes: mockMapAccountCodes } = require('../../../app/processing/account-codes')

jest.mock('../../../app/processing/complete-payment-requests')
const { completePaymentRequests: mockCompletePaymentRequests } = require('../../../app/processing/complete-payment-requests')

jest.mock('../../../app/event')
const { sendProcessingRouteEvent: mockSendProcessingRouteEvent } = require('../../../app/event')

const { MANUAL, ES, IMPS, FC, BPS } = require('../../../app/constants/schemes')

const { processPaymentRequest } = require('../../../app/processing/process-payment-request')

const scheduleId = 1

let paymentRequest
let scheduledPaymentRequest

describe('process payment request', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
    scheduledPaymentRequest = {
      paymentRequest,
      scheduleId
    }

    mockIsCrossBorder.mockReturnValue(false)
    mockTransformPaymentRequest.mockResolvedValue({ deltaPaymentRequest: paymentRequest, completedPaymentRequests: [paymentRequest] })
    mockApplyAutoHold.mockResolvedValue(false)
    mockRequiresDebtData.mockReturnValue(false)
    mockRequiresManualLedgerCheck.mockResolvedValue(false)
  })

  test('manual payments should complete payment request without further processing', async () => {
    paymentRequest.schemeId = MANUAL
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockCompletePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
    expect(mockTransformPaymentRequest).not.toHaveBeenCalled()
  })

  test('ES payments should complete payment request without further processing', async () => {
    paymentRequest.schemeId = ES
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockCompletePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
    expect(mockTransformPaymentRequest).not.toHaveBeenCalled()
  })

  test('IMPS payments should complete payment request without further processing', async () => {
    paymentRequest.schemeId = IMPS
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockCompletePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
    expect(mockTransformPaymentRequest).not.toHaveBeenCalled()
  })

  test('FC payments should complete payment request without further processing', async () => {
    paymentRequest.schemeId = FC
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockCompletePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
    expect(mockTransformPaymentRequest).not.toHaveBeenCalled()
  })

  test('should check if payment request is cross border if BPS', async () => {
    paymentRequest.schemeId = BPS
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockIsCrossBorder).toHaveBeenCalledWith(paymentRequest.invoiceLines)
  })

  test('should not check cross border if is not BPS', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockIsCrossBorder).not.toHaveBeenCalled()
  })

  test('should route to cross border if is BPS cross border', async () => {
    paymentRequest.schemeId = BPS
    mockIsCrossBorder.mockReturnValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockRouteToCrossBorder).toHaveBeenCalledWith(paymentRequest)
  })

  test('should not route to cross border if is not BPS but has cross border lines', async () => {
    mockIsCrossBorder.mockReturnValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockRouteToCrossBorder).not.toHaveBeenCalled()
  })

  test('should send processing route event if cross border', async () => {
    paymentRequest.schemeId = BPS
    mockIsCrossBorder.mockReturnValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockSendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'cross-border', 'request')
  })

  test('should transform payment request', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockTransformPaymentRequest).toHaveBeenCalledWith(paymentRequest)
  })

  test('should check if auto hold should be applied', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockApplyAutoHold).toHaveBeenCalledWith([paymentRequest])
  })

  test('should check if debt data is required', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockRequiresDebtData).toHaveBeenCalledWith([paymentRequest])
  })

  test('should route to debt editor if debt data is required', async () => {
    mockRequiresDebtData.mockReturnValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockRouteDebtToRequestEditor).toHaveBeenCalledWith(paymentRequest)
  })

  test('should send processing route event if debt data is required', async () => {
    mockRequiresDebtData.mockReturnValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockSendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'debt', 'request')
  })

  test('should check if manual ledger check is required', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockRequiresManualLedgerCheck).toHaveBeenCalledWith(paymentRequest)
  })

  test('should route to manual ledger editor if manual ledger check is required', async () => {
    mockRequiresManualLedgerCheck.mockResolvedValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockRouteManualLedgerToRequestEditor).toHaveBeenCalledWith({ deltaPaymentRequest: paymentRequest, completedPaymentRequests: [paymentRequest] })
  })

  test('should send processing route event if manual ledger check is required', async () => {
    mockRequiresManualLedgerCheck.mockResolvedValue(true)
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockSendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'manual-ledger', 'request')
  })

  test('should map account codes', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockMapAccountCodes).toHaveBeenCalledWith(paymentRequest)
  })

  test('should complete payment request', async () => {
    await processPaymentRequest(scheduledPaymentRequest)
    expect(mockCompletePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
  })
})
