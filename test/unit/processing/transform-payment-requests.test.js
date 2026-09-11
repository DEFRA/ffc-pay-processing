jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({
    BPS: 5,
    SFI: 1
  }))
}))

jest.mock('../../../app/processing/confirm-payment-request-number', () => ({
  confirmPaymentRequestNumber: jest.fn()
}))

jest.mock('../../../app/processing/get-completed-payment-requests', () => ({
  getCompletedPaymentRequests: jest.fn()
}))

jest.mock('../../../app/processing/delta', () => ({
  calculateDelta: jest.fn()
}))

jest.mock('../../../app/processing/dual-accounting', () => ({
  applyDualAccounting: jest.fn()
}))

jest.mock('../../../app/processing/due-dates', () => ({
  confirmDueDates: jest.fn()
}))

jest.mock('../../../app/processing/enrichment', () => ({
  enrichPaymentRequests: jest.fn()
}))

const { getSchemeIds } = require('ffc-pay-schemes')
const { confirmPaymentRequestNumber } = require('../../../app/processing/confirm-payment-request-number')
const { getCompletedPaymentRequests } = require('../../../app/processing/get-completed-payment-requests')
const { calculateDelta } = require('../../../app/processing/delta')
const { applyDualAccounting } = require('../../../app/processing/dual-accounting')
const { confirmDueDates } = require('../../../app/processing/due-dates')
const { enrichPaymentRequests } = require('../../../app/processing/enrichment')
const { transformPaymentRequest } = require('../../../app/processing/transform-payment-request')

const { BPS, SFI } = getSchemeIds()

describe('transformPaymentRequest', () => {
  let paymentRequest
  let previousPaymentRequests
  let sanitisedPaymentRequest

  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = {
      paymentRequestId: 1,
      paymentRequestNumber: 1,
      schemeId: SFI,
      frn: 1234567890,
      marketingYear: 2022,
      invalid: false,
      invoiceLines: []
    }

    previousPaymentRequests = []

    sanitisedPaymentRequest = {
      ...paymentRequest,
      dualAccountingApplied: true
    }

    confirmPaymentRequestNumber.mockResolvedValue(2)
    getCompletedPaymentRequests.mockResolvedValue(previousPaymentRequests)
    applyDualAccounting.mockReturnValue(sanitisedPaymentRequest)
  })

  test('confirms the payment request number for BPS payments', async () => {
    paymentRequest.schemeId = BPS

    const result = await transformPaymentRequest(paymentRequest)

    expect(confirmPaymentRequestNumber).toHaveBeenCalledWith(paymentRequest)
    expect(paymentRequest.paymentRequestNumber).toBe(2)
    expect(result).toEqual({
      completedPaymentRequests: [sanitisedPaymentRequest]
    })
  })

  test('does not confirm the payment request number for non-BPS payments', async () => {
    const result = await transformPaymentRequest(paymentRequest)

    expect(confirmPaymentRequestNumber).not.toHaveBeenCalled()
    expect(result).toEqual({
      completedPaymentRequests: [sanitisedPaymentRequest]
    })
  })

  test('gets completed payment requests', async () => {
    await transformPaymentRequest(paymentRequest)

    expect(getCompletedPaymentRequests).toHaveBeenCalledWith(paymentRequest)
  })

  test('applies dual accounting using the completed payment requests', async () => {
    await transformPaymentRequest(paymentRequest)

    expect(applyDualAccounting).toHaveBeenCalledWith(
      paymentRequest,
      previousPaymentRequests
    )
  })

  test('does not calculate delta when there are no previous payment requests', async () => {
    await transformPaymentRequest(paymentRequest)

    expect(calculateDelta).not.toHaveBeenCalled()
    expect(confirmDueDates).not.toHaveBeenCalled()
    expect(enrichPaymentRequests).not.toHaveBeenCalled()
  })

  test('calculates, confirms and enriches delta requests when previous payment requests exist', async () => {
    previousPaymentRequests = [{ paymentRequestId: 10 }]
    getCompletedPaymentRequests.mockResolvedValue(previousPaymentRequests)

    const deltaCompletedPaymentRequests = [{ paymentRequestId: 20 }]
    const confirmedPaymentRequests = [{ paymentRequestId: 21 }]
    const enrichedPaymentRequests = [{ paymentRequestId: 22 }]

    const deltaPaymentRequests = {
      completedPaymentRequests: deltaCompletedPaymentRequests
    }

    calculateDelta.mockReturnValue(deltaPaymentRequests)
    confirmDueDates.mockReturnValue(confirmedPaymentRequests)
    enrichPaymentRequests.mockReturnValue(enrichedPaymentRequests)

    const result = await transformPaymentRequest(paymentRequest)

    expect(calculateDelta).toHaveBeenCalledWith(
      sanitisedPaymentRequest,
      previousPaymentRequests
    )

    expect(confirmDueDates).toHaveBeenCalledWith(
      deltaCompletedPaymentRequests,
      previousPaymentRequests
    )

    expect(enrichPaymentRequests).toHaveBeenCalledWith(
      confirmedPaymentRequests,
      previousPaymentRequests
    )

    expect(result).toEqual({
      completedPaymentRequests: enrichedPaymentRequests
    })
  })

  test('returns the sanitised payment request when there are no previous payment requests', async () => {
    const result = await transformPaymentRequest(paymentRequest)

    expect(result).toEqual({
      completedPaymentRequests: [sanitisedPaymentRequest]
    })
  })
})
