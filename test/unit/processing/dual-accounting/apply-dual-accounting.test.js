jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({
    BPS: 6,
    CS: 5
  }))
}))

jest.mock('../../../../app/processing/dual-accounting/bps', () => ({
  applyBPSDualAccounting: jest.fn()
}))

jest.mock('../../../../app/processing/dual-accounting/cs', () => ({
  applyCSDualAccounting: jest.fn()
}))

const { applyBPSDualAccounting } = require('../../../../app/processing/dual-accounting/bps')
const { applyCSDualAccounting } = require('../../../../app/processing/dual-accounting/cs')
const { applyDualAccounting } = require('../../../../app/processing/dual-accounting/apply-dual-accounting')

describe('applyDualAccounting', () => {
  const previousPaymentRequests = [{ referenceId: 'previous' }]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('applies BPS dual accounting for a BPS payment request', () => {
    const paymentRequest = { schemeId: 6 }

    applyDualAccounting(paymentRequest, previousPaymentRequests)

    expect(applyBPSDualAccounting).toHaveBeenCalledWith(
      paymentRequest,
      previousPaymentRequests
    )
    expect(applyCSDualAccounting).not.toHaveBeenCalled()
  })

  test('applies CS dual accounting for a CS payment request', () => {
    const paymentRequest = { schemeId: 5 }

    applyDualAccounting(paymentRequest, previousPaymentRequests)

    expect(applyCSDualAccounting).toHaveBeenCalledWith(
      paymentRequest,
      previousPaymentRequests
    )
    expect(applyBPSDualAccounting).not.toHaveBeenCalled()
  })

  test('returns the payment request unchanged for other schemes', () => {
    const paymentRequest = { schemeId: 12 }

    const result = applyDualAccounting(
      paymentRequest,
      previousPaymentRequests
    )

    expect(result).toBe(paymentRequest)
    expect(applyBPSDualAccounting).not.toHaveBeenCalled()
    expect(applyCSDualAccounting).not.toHaveBeenCalled()
  })
})
