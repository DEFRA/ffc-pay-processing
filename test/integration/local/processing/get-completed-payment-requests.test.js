const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const { CS, FDMR } = require('../../../../app/constants/schemes')

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

  test('should not return any payment requests for different marketing year if not CS', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.marketingYear = 2021
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(0)
  })

  test('should return completed payment requests for different marketing year if CS', async () => {
    paymentRequest.schemeId = CS
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.marketingYear = 2021
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
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
    paymentRequest.invoiceNumber = 'INV-001'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(2)
  })

  test('should not include completed payment requests with later request numbers', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 3
    paymentRequest.invoiceNumber = 'INV-002'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
    expect(paymentRequests[0].paymentRequestNumber).toBe(1)
  })

  test('should not return invalid payment requests', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invalid = true
    paymentRequest.invoiceNumber = 'INV-003'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment requests if CS and previous contract has an extra leading zero', async () => {
    paymentRequest.schemeId = CS
    paymentRequest.contractNumber = 'A0123456'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.contractNumber = 'A123456'
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment requests if CS and current contract has an extra leading zero', async () => {
    paymentRequest.schemeId = CS
    paymentRequest.contractNumber = 'A123456'
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.contractNumber = 'A0123456'
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment requests if first invoice line matches scheme code of current payment request', async () => {
    paymentRequest.schemeId = FDMR
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return payment requests if first invoice line does not match scheme code of current payment request', async () => {
    paymentRequest.schemeId = FDMR
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invoiceLines[0].schemeCode = 'Different'
    paymentRequest.paymentRequestNumber = 2
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(0)
  })

  test('should include manually injected payment requests', async () => {
    paymentRequest.paymentRequestNumber = 0
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 1
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
    expect(paymentRequests[0].paymentRequestNumber).toBe(0)
  })

  test('should include all completed payment requests if manually injected', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 0
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
    expect(paymentRequests[0].paymentRequestNumber).toBe(1)
  })

  test('should include all previous manually injected completed payment requests if manually injected', async () => {
    paymentRequest.paymentRequestNumber = 0
    await savePaymentRequest(paymentRequest, true)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest)
    expect(paymentRequests.length).toBe(1)
    expect(paymentRequests[0].paymentRequestNumber).toBe(0)
  })
})
