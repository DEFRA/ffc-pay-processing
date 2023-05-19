const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const { CS } = require('../../../../app/constants/schemes')

const { getCompletedPaymentRequests } = require('../../../../app/processing/get-completed-payment-requests')

let paymentRequest

describe('get completed payment requests', () => {
  beforeEach(async () => {
    await resetDatabase()
    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should not return any payment requests if none completed for agreement', async () => {
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(0)
  })

  test('should return completed payment requests for agreement', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return any payment requests for different customer', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.frn = 1234567891
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests for different marketing year', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.marketingYear = 2021
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests for different scheme', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.schemeId = 2
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(0)
  })

  test('should return all completed payment requests for agreement', async () => {
    await savePaymentRequest(paymentRequest, true)
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(2)
  })

  test('should not include completed payment requests with later request numbers', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 3
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
    expect(paymentRequests[0].paymentRequestNumber).toBe(1)
  })

  test('should not return invalid payment requests', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invalid = true
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment requests if CS and previous contract has an extra leading zero', async () => {
    paymentRequest.schemeId = CS
    paymentRequest.contractNumber = 'A0123456'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.agreementNumber = 'A123456'
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment requests if CS and current contract has an extra leading zero', async () => {
    paymentRequest.schemeId = CS
    paymentRequest.contractNumber = 'A123456'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.agreementNumber = 'A0123456'
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })
})
