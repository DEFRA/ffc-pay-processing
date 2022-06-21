const db = require('../../../../app/data')
const getCompletedPaymentRequests = require('../../../../app/processing/get-completed-payment-requests')
let scheme
let paymentRequest
let completedPaymentRequest

describe('get completed payment requests', () => {
  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true })

    scheme = {
      schemeId: 1,
      name: 'SFI'
    }

    paymentRequest = {
      paymentRequestId: 1,
      schemeId: 1,
      frn: 1234567890,
      marketingYear: 2022,
      agreementNumber: 'AG12345678',
      paymentRequestNumber: 1
    }

    completedPaymentRequest = {
      completedPaymentRequest: 1,
      paymentRequestId: 1,
      schemeId: 1,
      frn: 1234567890,
      marketingYear: 2022,
      agreementNumber: 'AG12345678',
      paymentRequestNumber: 1,
      invalid: false
    }
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should not return any payment requests if none completed for agreement', async () => {
    await db.scheme.create(scheme)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, paymentRequest.frn, paymentRequest.marketingYear, paymentRequest.agreementNumber, 2)
    expect(paymentRequests.length).toBe(0)
  })

  test('should return completed payment requests for agreement', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, paymentRequest.frn, paymentRequest.marketingYear, paymentRequest.agreementNumber, 2)
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return any payment requests for different customer', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, 1234567891, paymentRequest.marketingYear, paymentRequest.agreementNumber, 2)
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests for different marketing year', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, paymentRequest.frn, 2021, paymentRequest.agreementNumber, 2)
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests for different scheme', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(2, paymentRequest.frn, paymentRequest.marketingYear, paymentRequest.agreementNumber, 2)
    expect(paymentRequests.length).toBe(0)
  })

  test('should return all completed payment requests for agreement', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    paymentRequest.paymentRequestId = 2
    await db.paymentRequest.create(paymentRequest)
    completedPaymentRequest.completedPaymentRequestId = 2
    completedPaymentRequest.paymentRequestId = 2
    completedPaymentRequest.paymentRequestNumber = 2
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, paymentRequest.frn, paymentRequest.marketingYear, paymentRequest.agreementNumber, 3)
    expect(paymentRequests.length).toBe(2)
  })

  test('should not include completed payment requests with later request numbers', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    paymentRequest.paymentRequestId = 3
    await db.paymentRequest.create(paymentRequest)
    completedPaymentRequest.completedPaymentRequestId = 3
    completedPaymentRequest.paymentRequestId = 3
    completedPaymentRequest.paymentRequestNumber = 3
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, paymentRequest.frn, paymentRequest.marketingYear, paymentRequest.agreementNumber, 2)
    expect(paymentRequests.length).toBe(1)
    expect(paymentRequests[0].paymentRequestNumber).toBe(1)
  })

  test('should not return invalid payment requests', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(completedPaymentRequest)
    paymentRequest.paymentRequestId = 2
    await db.paymentRequest.create(paymentRequest)
    completedPaymentRequest.completedPaymentRequestId = 2
    completedPaymentRequest.paymentRequestId = 2
    completedPaymentRequest.paymentRequestNumber = 2
    completedPaymentRequest.invalid = true
    await db.completedPaymentRequest.create(completedPaymentRequest)
    const paymentRequests = await getCompletedPaymentRequests(paymentRequest.schemeId, paymentRequest.frn, paymentRequest.marketingYear, paymentRequest.agreementNumber, 3)
    expect(paymentRequests.length).toBe(1)
  })
})
