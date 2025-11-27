const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')
const { CS, FDMR } = require('../../../../app/constants/schemes')
const { getCompletedPaymentRequests } = require('../../../../app/processing/get-completed-payment-requests')

let paymentRequest

describe('get completed payment requests', () => {
  beforeEach(async () => {
    await resetDatabase()
    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should return empty array if no completed requests for agreement', async () => {
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(0)
  })

  test('should return completed requests for agreement', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
  })

  test.each([
    ['different customer', pr => { pr.frn = 1234567891 }],
    ['different scheme', pr => { pr.schemeId = 2 }],
    ['different marketing year (non-CS)', pr => { pr.marketingYear = 2021 }]
  ])('should not return requests for %s', async (_desc, mutate) => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    mutate(paymentRequest)
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(0)
  })

  test('should return requests for CS scheme even with different marketing year', async () => {
    paymentRequest.schemeId = CS
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.marketingYear = 2021
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
  })

  test('should return all completed requests for agreement', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invoiceNumber = 'INV-001'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(2)
  })

  test('should not include requests with later numbers', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 3
    paymentRequest.invoiceNumber = 'INV-002'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
    expect(requests[0].paymentRequestNumber).toBe(1)
  })

  test('should ignore invalid completed requests', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invalid = true
    paymentRequest.invoiceNumber = 'INV-003'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
  })

  test.each([
    ['previous contract has leading zero', 'A0123456', 'A123456'],
    ['current contract has leading zero', 'A123456', 'A0123456']
  ])('should handle contracts with extra leading zero (%s)', async (_desc, prevContract, currentContract) => {
    paymentRequest.schemeId = CS
    paymentRequest.contractNumber = prevContract
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.contractNumber = currentContract
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
  })

  test('should return requests if first invoice line matches scheme code', async () => {
    paymentRequest.schemeId = FDMR
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
  })

  test('should not return requests if first invoice line does not match scheme code', async () => {
    paymentRequest.schemeId = FDMR
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invoiceLines[0].schemeCode = 'Different'
    paymentRequest.paymentRequestNumber = 2
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(0)
  })

  test.each([
    ['manually injected first', 0, 1],
    ['manually injected later', 1, 0],
    ['all previous manually injected', 0, 0]
  ])('should include manually injected requests (%s)', async (_desc, initialNumber, subsequentNumber) => {
    paymentRequest.paymentRequestNumber = initialNumber
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = subsequentNumber
    const requests = await getCompletedPaymentRequests(paymentRequest)
    expect(requests.length).toBe(1)
    expect(requests[0].paymentRequestNumber).toBe(initialNumber)
  })
})
