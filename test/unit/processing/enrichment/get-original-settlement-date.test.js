const { getOriginalSettlementDate } = require('../../../../app/processing/enrichment/get-original-settlement-date')

let paymentRequest
let paymentRequests

describe('get original settlement date', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    paymentRequest.lastSettled = '01/01/2023'

    paymentRequests = [paymentRequest]
  })

  test('should return undefined if no previous payment requests', () => {
    expect(getOriginalSettlementDate([])).toBeUndefined()
  })

  test('should get settlement date if only one payment request', () => {
    expect(getOriginalSettlementDate(paymentRequests)).toEqual(paymentRequest.settlementDate)
  })

  test('should get earliest settlement date if multiple payment requests and earliest settled first', () => {
    paymentRequests.push(structuredClone(paymentRequest))
    paymentRequests[1].paymentRequestNumber = 2
    paymentRequests[1].lastSettled = '01/01/2024'
    expect(getOriginalSettlementDate(paymentRequests)).toEqual(paymentRequests[0].settlementDate)
  })

  test('should get earliest settlement date if multiple payment requests and earliest settled last', () => {
    paymentRequests.push(structuredClone(paymentRequest))
    paymentRequests[1].paymentRequestNumber = 2
    paymentRequests[1].lastSettled = '01/01/2022'
    expect(getOriginalSettlementDate(paymentRequests)).toEqual(paymentRequests[1].settlementDate)
  })
})
