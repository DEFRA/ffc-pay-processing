const { getSchemeIds } = require('ffc-pay-schemes')

jest.mock('../../../app/config/processing', () => ({
  handleSchemeClosures: true
}))

jest.mock('../../../app/processing/complete-payment-requests', () => ({
  completePaymentRequests: jest.fn()
}))

jest.mock('../../../app/processing/is-cross-border', () => ({
  isCrossBorder: jest.fn()
}))

jest.mock('../../../app/processing/transform-payment-request', () => ({
  transformPaymentRequest: jest.fn()
}))

jest.mock('../../../app/auto-hold', () => ({
  applyAutoHold: jest.fn()
}))

jest.mock('../../../app/processing/requires-debt-data', () => ({
  requiresDebtData: jest.fn()
}))

jest.mock('../../../app/routing', () => ({
  routeDebtToRequestEditor: jest.fn(),
  routeManualLedgerToRequestEditor: jest.fn(),
  routeToCrossBorder: jest.fn()
}))

jest.mock('../../../app/event', () => ({
  sendProcessingRouteEvent: jest.fn()
}))

jest.mock('../../../app/processing/requires-manual-ledger-check', () => ({
  requiresManualLedgerCheck: jest.fn()
}))

jest.mock('../../../app/processing/account-codes', () => ({
  mapAccountCodes: jest.fn()
}))

jest.mock('../../../app/processing/is-agreement-closed', () => ({
  isAgreementClosed: jest.fn()
}))

jest.mock('../../../app/processing/suppress-ar-payment-requests', () => ({
  suppressARPaymentRequests: jest.fn()
}))

const { processPaymentRequest } = require('../../../app/processing/process-payment-request')
const { MANUAL, ES, IMPS, FC, BPS } = getSchemeIds()
const { completePaymentRequests } = require('../../../app/processing/complete-payment-requests')
const { isCrossBorder } = require('../../../app/processing/is-cross-border')
const { transformPaymentRequest } = require('../../../app/processing/transform-payment-request')
const { applyAutoHold } = require('../../../app/auto-hold')
const { requiresDebtData } = require('../../../app/processing/requires-debt-data')
const {
  routeDebtToRequestEditor,
  routeManualLedgerToRequestEditor,
  routeToCrossBorder
} = require('../../../app/routing')
const { sendProcessingRouteEvent } = require('../../../app/event')
const { requiresManualLedgerCheck } = require('../../../app/processing/requires-manual-ledger-check')
const { mapAccountCodes } = require('../../../app/processing/account-codes')
const { isAgreementClosed } = require('../../../app/processing/is-agreement-closed')
const { suppressARPaymentRequests } = require('../../../app/processing/suppress-ar-payment-requests')

describe('processPaymentRequest', () => {
  let paymentRequest
  let scheduledPaymentRequest

  const scheduleId = 'schedule-123'

  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = structuredClone(
      require('../../mocks/payment-requests/payment-request')
    )

    scheduledPaymentRequest = {
      paymentRequest,
      scheduleId
    }

    isCrossBorder.mockReturnValue(false)

    transformPaymentRequest.mockResolvedValue({
      deltaPaymentRequest: paymentRequest,
      completedPaymentRequests: [paymentRequest]
    })

    applyAutoHold.mockResolvedValue(false)
    requiresDebtData.mockReturnValue(false)
    requiresManualLedgerCheck.mockResolvedValue(false)
    isAgreementClosed.mockResolvedValue(false)
    suppressARPaymentRequests.mockResolvedValue([paymentRequest])
  })

  test.each([MANUAL, ES, IMPS, FC])(
    '%s payments complete without further processing',
    async scheme => {
      paymentRequest.schemeId = scheme

      await processPaymentRequest(scheduledPaymentRequest)

      expect(completePaymentRequests).toHaveBeenCalledWith(
        scheduleId,
        [paymentRequest]
      )
      expect(transformPaymentRequest).not.toHaveBeenCalled()
    }
  )

  test('handles BPS cross-border payments', async () => {
    paymentRequest.schemeId = BPS
    isCrossBorder.mockReturnValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(sendProcessingRouteEvent).toHaveBeenCalledWith(
      paymentRequest,
      'cross-border',
      'request'
    )
    expect(routeToCrossBorder).toHaveBeenCalledWith(paymentRequest)
    expect(transformPaymentRequest).not.toHaveBeenCalled()
  })

  test('transforms and completes standard payments', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'

    await processPaymentRequest(scheduledPaymentRequest)

    expect(transformPaymentRequest).toHaveBeenCalledWith(paymentRequest)
    expect(isAgreementClosed).toHaveBeenCalledWith(paymentRequest)
    expect(applyAutoHold).toHaveBeenCalledWith([paymentRequest])
    expect(mapAccountCodes).toHaveBeenCalledWith(paymentRequest)
    expect(completePaymentRequests).toHaveBeenCalledWith(
      scheduleId,
      [paymentRequest]
    )
  })

  test('suppresses AR payments when the agreement is closed', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    isAgreementClosed.mockResolvedValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(suppressARPaymentRequests).toHaveBeenCalledWith(
      paymentRequest,
      [paymentRequest]
    )
  })

  test('applies an auto hold and exits early', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    applyAutoHold.mockResolvedValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(applyAutoHold).toHaveBeenCalledWith([paymentRequest])
    expect(completePaymentRequests).not.toHaveBeenCalled()
  })

  test('routes payments requiring debt data', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    requiresDebtData.mockReturnValue(true)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(requiresDebtData).toHaveBeenCalledWith([paymentRequest])
    expect(sendProcessingRouteEvent).toHaveBeenCalledWith(
      paymentRequest,
      'debt',
      'request'
    )
    expect(routeDebtToRequestEditor).toHaveBeenCalledWith(paymentRequest)
    expect(completePaymentRequests).not.toHaveBeenCalled()
  })

  test('routes payments requiring a manual ledger check', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'
    requiresManualLedgerCheck.mockResolvedValue(true)

    const transformedPayment = {
      deltaPaymentRequest: paymentRequest,
      completedPaymentRequests: [paymentRequest]
    }

    transformPaymentRequest.mockResolvedValue(transformedPayment)

    await processPaymentRequest(scheduledPaymentRequest)

    expect(requiresManualLedgerCheck).toHaveBeenCalledWith(paymentRequest)
    expect(sendProcessingRouteEvent).toHaveBeenCalledWith(
      paymentRequest,
      'manual-ledger',
      'request'
    )
    expect(routeManualLedgerToRequestEditor).toHaveBeenCalledWith(
      transformedPayment
    )
    expect(completePaymentRequests).not.toHaveBeenCalled()
  })

  test('maps account codes and completes eligible payments', async () => {
    paymentRequest.schemeId = 'OTHER_SCHEME'

    await processPaymentRequest(scheduledPaymentRequest)

    expect(mapAccountCodes).toHaveBeenCalledWith(paymentRequest)
    expect(completePaymentRequests).toHaveBeenCalledWith(
      scheduleId,
      [paymentRequest]
    )
  })

  describe('additional payment fields', () => {
    test('preserves additional fields through processing', async () => {
      Object.assign(paymentRequest, {
        schemeId: 'OTHER_SCHEME',
        genericStringField: 'GENERIC-STRING',
        fesCode: 'FES123',
        annualValue: '1234.56',
        remmittanceDescription: 'Quarterly remittance'
      })

      await processPaymentRequest(scheduledPaymentRequest)

      const expectedFields = expect.objectContaining({
        genericStringField: 'GENERIC-STRING',
        fesCode: 'FES123',
        annualValue: '1234.56',
        remmittanceDescription: 'Quarterly remittance'
      })

      expect(transformPaymentRequest).toHaveBeenCalledWith(expectedFields)
      expect(mapAccountCodes).toHaveBeenCalledWith(expectedFields)
      expect(completePaymentRequests).toHaveBeenCalledWith(
        scheduleId,
        [expectedFields]
      )
    })

    test('handles missing optional fields', async () => {
      Object.assign(paymentRequest, {
        schemeId: 'OTHER_SCHEME',
        genericStringField: undefined,
        fesCode: undefined,
        annualValue: undefined,
        remmittanceDescription: undefined
      })

      await processPaymentRequest(scheduledPaymentRequest)

      const expectedFields = expect.objectContaining({
        genericStringField: undefined,
        fesCode: undefined,
        annualValue: undefined,
        remmittanceDescription: undefined
      })

      expect(transformPaymentRequest).toHaveBeenCalledWith(expectedFields)
      expect(mapAccountCodes).toHaveBeenCalledWith(expectedFields)
      expect(completePaymentRequests).toHaveBeenCalledWith(
        scheduleId,
        [expectedFields]
      )
    })

    test('preserves annual value precision', async () => {
      Object.assign(paymentRequest, {
        schemeId: 'OTHER_SCHEME',
        annualValue: '9876543210.123456789',
        fesCode: 'FES-PRECISION',
        remmittanceDescription: 'Precision test'
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
    })

    test('preserves additional fields when routing to manual ledger', async () => {
      Object.assign(paymentRequest, {
        schemeId: 'OTHER_SCHEME',
        fesCode: 'FES-LEDGER',
        annualValue: '100.00',
        remmittanceDescription: 'Manual ledger flow',
        genericStringField: 'SOME-STRING'
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
