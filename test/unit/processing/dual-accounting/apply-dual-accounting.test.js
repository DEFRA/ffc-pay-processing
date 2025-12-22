jest.mock('../../../../app/processing/dual-accounting/bps')
const { applyBPSDualAccounting: mockApplyBPSDualAccounting } = require('../../../../app/processing/dual-accounting/bps')

jest.mock('../../../../app/processing/dual-accounting/cs')
const { applyCSDualAccounting: mockApplyCSDualAccounting } = require('../../../../app/processing/dual-accounting/cs')

const bpsPaymentRequest = require('../../../mocks/payment-requests/bps')
const csPaymentRequest = require('../../../mocks/payment-requests/cs')
const sfiPaymentRequest = require('../../../mocks/payment-requests/sfi')

const { applyDualAccounting } = require('../../../../app/processing/dual-accounting')

describe('applyDualAccounting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const testCases = [
    { name: 'BPS', request: bpsPaymentRequest, mockFn: mockApplyBPSDualAccounting },
    { name: 'CS', request: csPaymentRequest, mockFn: mockApplyCSDualAccounting }
  ]

  testCases.forEach(({ name, request, mockFn }) => {
    describe(`${name} scheme`, () => {
      let paymentRequest, previousPaymentRequests

      beforeEach(() => {
        paymentRequest = request
        previousPaymentRequests = [request]
        applyDualAccounting(paymentRequest, previousPaymentRequests)
      })

      test(`should call ${name} dual accounting`, () => {
        expect(mockFn).toHaveBeenCalledTimes(1)
      })

      test(`should call ${name} dual accounting with current and previous payment requests`, () => {
        expect(mockFn).toHaveBeenCalledWith(paymentRequest, previousPaymentRequests)
      })
    })
  })

  test('should not apply dual accounting for other schemes', () => {
    const paymentRequest = sfiPaymentRequest
    const previousPaymentRequests = [sfiPaymentRequest]
    applyDualAccounting(paymentRequest, previousPaymentRequests)
    expect(mockApplyBPSDualAccounting).not.toHaveBeenCalled()
    expect(mockApplyCSDualAccounting).not.toHaveBeenCalled()
  })
})
