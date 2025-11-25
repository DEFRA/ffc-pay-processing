jest.mock('../../../app/event')
const { sendSuppressedEvent: mockSendSuppressedEvent } = require('../../../app/event')
const { AP, AR } = require('../../../app/constants/ledgers')
const { suppressARPaymentRequests } = require('../../../app/processing/suppress-ar-payment-requests')

describe('suppressARPaymentRequests', () => {
  let paymentRequest
  let completedPaymentRequests

  beforeEach(() => {
    jest.clearAllMocks()
    paymentRequest = { value: -100 }
    completedPaymentRequests = [
      { ledger: AP, value: -75 },
      { ledger: AR, value: -25 }
    ]
  })

  test('should correctly suppress AR payment requests and keep AP intact', async () => {
    const result = await suppressARPaymentRequests(paymentRequest, completedPaymentRequests)
    expect(result.find(x => x.ledger === AR).value).toBe(0)
    expect(result.find(x => x.ledger === AP).value).toBe(-75)
    expect(result.length).toBe(2)
  })

  test('should send suppressed event with correct values', async () => {
    await suppressARPaymentRequests(paymentRequest, completedPaymentRequests)
    expect(mockSendSuppressedEvent).toHaveBeenCalledWith(paymentRequest, -100, -75, -25)
  })
})
