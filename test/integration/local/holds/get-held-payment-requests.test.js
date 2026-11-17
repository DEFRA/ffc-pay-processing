const { resetDatabase, closeDatabaseConnection, saveSchedule } = require('../../../helpers')

const { FRN } = require('../../../mocks/values/frn')
const newSchedule = require('../../../mocks/schedules/new')
const completedSchedule = require('../../../mocks/schedules/completed')

const db = require('../../../../app/database')

const { getHeldPaymentRequests } = require('../../../../app/holds/get-held-payment-requests')

let paymentRequest
let holdCategory

const addHold = (closed) => db.hold().insert({ frn: FRN, holdCategoryId: holdCategory.holdCategoryId, added: new Date(), closed })

describe('get held payment requests', () => {
  beforeEach(async () => {
    await resetDatabase()
    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
    holdCategory = await db.holdCategory().where({ schemeId: paymentRequest.schemeId }).first()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should return payment request with incomplete schedule if open hold for FRN and scheme', async () => {
    const { paymentRequestId } = await saveSchedule(newSchedule, paymentRequest)
    await addHold()
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId)
    expect(paymentRequests).toHaveLength(1)
    expect(paymentRequests[0].paymentRequestId).toBe(paymentRequestId)
    expect(paymentRequests[0].correlationId).toBe(paymentRequest.correlationId)
    expect(paymentRequests[0].invoiceNumber).toBe(paymentRequest.invoiceNumber)
  })

  test('should include invoice lines', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    await addHold()
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId)
    expect(paymentRequests[0].invoiceLines).toHaveLength(paymentRequest.invoiceLines.length)
  })

  test('should not return payment request if no hold', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId)
    expect(paymentRequests).toHaveLength(0)
  })

  test('should not return payment request if hold closed', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    await addHold(new Date())
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId)
    expect(paymentRequests).toHaveLength(0)
  })

  test('should not return payment request if schedule completed', async () => {
    await saveSchedule(completedSchedule, paymentRequest)
    await addHold()
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId)
    expect(paymentRequests).toHaveLength(0)
  })

  test('should not return payment request for different FRN', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    await addHold()
    const paymentRequests = await getHeldPaymentRequests(234567891, paymentRequest.schemeId)
    expect(paymentRequests).toHaveLength(0)
  })

  test('should not return payment request for different scheme', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    await addHold()
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId + 1)
    expect(paymentRequests).toHaveLength(0)
  })

  test('should only return given payment request id', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    await addHold()
    const paymentRequests = await getHeldPaymentRequests(FRN, paymentRequest.schemeId, { paymentRequestId: -1 })
    expect(paymentRequests).toHaveLength(0)
  })
})
