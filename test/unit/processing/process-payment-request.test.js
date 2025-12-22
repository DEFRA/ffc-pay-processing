const { processPaymentRequest } = require('../../../app/processing/process-payment-request')
const { MANUAL, ES, IMPS, FC, BPS } = require('../../../app/constants/schemes')
const { completePaymentRequests } = require('../../../app/processing/complete-payment-requests')
const { isCrossBorder } = require('../../../app/processing/is-cross-border')
const { transformPaymentRequest } = require('../../../app/processing/transform-payment-request')
const { applyAutoHold } = require('../../../app/auto-hold')
const { requiresDebtData } = require('../../../app/processing/requires-debt-data')
const { routeDebtToRequestEditor, routeManualLedgerToRequestEditor, routeToCrossBorder } = require('../../../app/routing')
const { sendProcessingRouteEvent } = require('../../../app/event')
const { requiresManualLedgerCheck } = require('../../../app/processing/requires-manual-ledger-check')
const { mapAccountCodes } = require('../../../app/processing/account-codes')
const { isAgreementClosed } = require('../../../app/processing/is-agreement-closed')
const { suppressARPaymentRequests } = require('../../../app/processing/suppress-ar-payment-requests')

jest.mock('../../../app/processing/complete-payment-requests')
jest.mock('../../../app/processing/is-cross-border')
jest.mock('../../../app/processing/transform-payment-request')
jest.mock('../../../app/auto-hold')
jest.mock('../../../app/processing/requires-debt-data')
jest.mock('../../../app/routing')
jest.mock('../../../app/event')
jest.mock('../../../app/processing/requires-manual-ledger-check')
jest.mock('../../../app/processing/account-codes')
jest.mock('../../../app/processing/is-agreement-closed')
jest.mock('../../../app/processing/suppress-ar-payment-requests')

describe('processPaymentRequest', () => {
  let paymentRequest
  let scheduledPaymentRequest
  const scheduleId = 'schedule-123'

  beforeEach(() => {
    jest.clearAllMocks()
    paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
    scheduledPaymentRequest = { paymentRequest, scheduleId }

    isCrossBorder.mockReturnValue(false)
    transformPaymentRequest.mockResolvedValue({ deltaPaymentRequest: paymentRequest, completedPaymentRequests: [paymentRequest] })
    applyAutoHold.mockResolvedValue(false)
    requiresDebtData.mockReturnValue(false)
    requiresManualLedgerCheck.mockResolvedValue(false)
    isAgreementClosed.mockResolvedValue(false)
    suppressARPaymentRequests.mockResolvedValue([paymentRequest])
  })

  test.each([MANUAL, ES, IMPS, FC])(
    '%s payments should complete payment request without further processing',
    async scheme => {
      paymentRequest.schemeId = scheme
      await processPaymentRequest(scheduledPaymentRequest)
      expect(completePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
      expect(transformPaymentRequest).not.toHaveBeenCalled()
    }
  )

  test('BPS cross-border payments should be handled correctly', async () => {
    paymentRequest.schemeId = BPS
    isCrossBorder.mockReturnValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(sendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'cross-border', 'request')
    expect(routeToCrossBorder).toHaveBeenCalledWith(paymentRequest)
    expect(transformPaymentRequest).not.toHaveBeenCalled()
  })

  test('non-manual, non-cross-border payments should transform and complete correctly', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'

    await processPaymentRequest(scheduledPaymentRequest)

    expect(transformPaymentRequest).toHaveBeenCalledWith(paymentRequest)
    expect(isAgreementClosed).toHaveBeenCalledWith(paymentRequest)
    expect(applyAutoHold).toHaveBeenCalledWith([paymentRequest])
    expect(mapAccountCodes).toHaveBeenCalledWith(paymentRequest)
    expect(completePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
  })

  test('should handle agreement closure correctly', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    isAgreementClosed.mockResolvedValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(isAgreementClosed).toHaveBeenCalledWith(paymentRequest)
    expect(suppressARPaymentRequests).toHaveBeenCalledWith(paymentRequest, [paymentRequest])
    expect(paymentRequest).toBeDefined()
  })

  test('should apply auto hold and exit early', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    applyAutoHold.mockResolvedValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(applyAutoHold).toHaveBeenCalledWith([paymentRequest])
    expect(completePaymentRequests).not.toHaveBeenCalled()
  })

  test('should handle debt data when required', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    requiresDebtData.mockReturnValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(requiresDebtData).toHaveBeenCalledWith([paymentRequest])
    expect(sendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'debt', 'request')
    expect(routeDebtToRequestEditor).toHaveBeenCalledWith(paymentRequest)
    expect(completePaymentRequests).not.toHaveBeenCalled()
  })

  test('should handle manual ledger check when required', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    transformPaymentRequest.mockResolvedValue({ deltaPaymentRequest: paymentRequest, completedPaymentRequests: [paymentRequest] })
    requiresManualLedgerCheck.mockResolvedValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(requiresManualLedgerCheck).toHaveBeenCalledWith(paymentRequest)
    expect(sendProcessingRouteEvent).toHaveBeenCalledWith(paymentRequest, 'manual-ledger', 'request')
    expect(routeManualLedgerToRequestEditor).toHaveBeenCalledWith({ deltaPaymentRequest: paymentRequest, completedPaymentRequests: [paymentRequest] })
    expect(completePaymentRequests).not.toHaveBeenCalled()
  })

  test('should map account codes and complete payment requests when all conditions are met', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'

    await processPaymentRequest(scheduledPaymentRequest)

    expect(mapAccountCodes).toHaveBeenCalledWith(paymentRequest)
    expect(completePaymentRequests).toHaveBeenCalledWith(scheduleId, [paymentRequest])
  })
  
  describe('new fields: fesCode, annualValue, remmittanceDescription, and generic STRING handling', () => {
    test('should pass new string fields through transform and complete unchanged', async () => {
      paymentRequest.schemeId = 'OTHER_SCHEME'
      paymentRequest.genericStringField = 'GENERIC-STRING'
      paymentRequest.fesCode = 'FES123'
      paymentRequest.annualValue = '1234.56'
      paymentRequest.remmittanceDescription = 'Quarterly remittance'

      transformPaymentRequest.mockResolvedValue({
        deltaPaymentRequest: paymentRequest,
        completedPaymentRequests: [paymentRequest]
      })

      await processPaymentRequest(scheduledPaymentRequest)

      expect(transformPaymentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          genericStringField: 'GENERIC-STRING',
          fesCode: 'FES123',
          annualValue: '1234.56',
          remmittanceDescription: 'Quarterly remittance'
        })
      )

      expect(mapAccountCodes).toHaveBeenCalledWith(
        expect.objectContaining({
          genericStringField: 'GENERIC-STRING',
          fesCode: 'FES123',
          annualValue: '1234.56',
          remmittanceDescription: 'Quarterly remittance'
        })
      )

      expect(completePaymentRequests).toHaveBeenCalledWith(
        scheduleId,
        [
          expect.objectContaining({
            genericStringField: 'GENERIC-STRING',
            fesCode: 'FES123',
            annualValue: '1234.56',
            remmittanceDescription: 'Quarterly remittance'
          })
        ]
      )
    })

    test('should handle missing optional fields gracefully (undefined values)', async () => {
      paymentRequest.schemeId = 'OTHER_SCHEME'
      paymentRequest.genericStringField = undefined
      paymentRequest.fesCode = undefined
      paymentRequest.annualValue = undefined
      paymentRequest.remmittanceDescription = undefined

      transformPaymentRequest.mockResolvedValue({
        deltaPaymentRequest: paymentRequest,
        completedPaymentRequests: [paymentRequest]
      })

      await processPaymentRequest(scheduledPaymentRequest)

      expect(transformPaymentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          genericStringField: undefined,
          fesCode: undefined,
          annualValue: undefined,
          remmittanceDescription: undefined
        })
      )

      expect(mapAccountCodes).toHaveBeenCalledWith(
        expect.objectContaining({
          genericStringField: undefined,
          fesCode: undefined,
          annualValue: undefined,
          remmittanceDescription: undefined
        })
      )

      expect(completePaymentRequests).toHaveBeenCalledWith(
        scheduleId,
        [
          expect.objectContaining({
            genericStringField: undefined,
            fesCode: undefined,
            annualValue: undefined,
            remmittanceDescription: undefined
          })
        ]
      )
    })

    test('should retain DECIMAL precision for annualValue through processing', async () => {
      paymentRequest.schemeId = 'OTHER_SCHEME'
      paymentRequest.annualValue = '9876543210.123456789'
      paymentRequest.fesCode = 'FES-PRECISION'
      paymentRequest.remmittanceDescription = 'Precision test'

      transformPaymentRequest.mockResolvedValue({
        deltaPaymentRequest: paymentRequest,
        completedPaymentRequests: [paymentRequest]
      })

      await processPaymentRequest(scheduledPaymentRequest)

      expect(transformPaymentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          annualValue: '9876543210.123456789'
        })
      )

      expect(mapAccountCodes).toHaveBeenCalledWith(
        expect.objectContaining({
          annualValue: '9876543210.123456789'
        })
      )

      expect(completePaymentRequests).toHaveBeenCalledWith(
        scheduleId,
        [
          expect.objectContaining({
            annualValue: '9876543210.123456789'
          })
        ]
      )
    })

    test('should route correctly when manual ledger check is required, still preserving new fields', async () => {
      paymentRequest.schemeId = 'OTHER_SCHEME'
      paymentRequest.fesCode = 'FES-LEDGER'
      paymentRequest.annualValue = '100.00'
      paymentRequest.remmittanceDescription = 'Manual ledger flow'
      paymentRequest.genericStringField = 'SOME-STRING'

      transformPaymentRequest.mockResolvedValue({
        deltaPaymentRequest: paymentRequest,
        completedPaymentRequests: [paymentRequest]
      })
      requiresManualLedgerCheck.mockResolvedValue(true)

      await processPaymentRequest(scheduledPaymentRequest)

      expect(routeManualLedgerToRequestEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          deltaPaymentRequest: expect.objectContaining({
            fesCode: 'FES-LEDGER',
            annualValue: '100.00',
            remmittanceDescription: 'Manual ledger flow',
            genericStringField: 'SOME-STRING'
          }),
          completedPaymentRequests: [
            expect.objectContaining({
              fesCode: 'FES-LEDGER',
              annualValue: '100.00',
              remmittanceDescription: 'Manual ledger flow',
              genericStringField: 'SOME-STRING'
            })
          ]
        })
      )

      expect(completePaymentRequests).not.toHaveBeenCalled()
    })
  })
})
