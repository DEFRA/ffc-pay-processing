const { resetDatabase, closeDatabaseConnection } = require('../../helpers')
const { isAgreementClosed } = require('../../../app/processing/is-agreement-closed')
const { closureDBEntry } = require('../../mocks/closure/closure-db-entry')
const db = require('../../../app/data')
const { BPS } = require('../../../app/constants/schemes')
const { FRN } = require('../../mocks/values/frn')
const { FUTURE_DATE } = require('../../mocks/values/future-date')

let paymentRequest
let baseClosure

describe('is agreement closed', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()

    paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
    paymentRequest.value = 0

    baseClosure = structuredClone(closureDBEntry)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should return true if the closure is raised with date in the past', async () => {
    await db.frnAgreementClosed.create(baseClosure)
    expect(await isAgreementClosed(paymentRequest)).toBe(true)
  })

  test('should return false if no closure has been created', async () => {
    expect(await isAgreementClosed(paymentRequest)).toBe(false)
  })

  test.each([
    { desc: 'different scheme', modify: c => { c.schemeId = BPS } },
    { desc: 'different FRN', modify: c => { c.frn = FRN + 1 } },
    { desc: 'different agreement number', modify: c => { c.agreementNumber = 'SIP00000000002' } },
    { desc: 'closure date in future', modify: c => { c.closureDate = FUTURE_DATE } }
  ])('should return false if a closure with $desc has been created', async ({ modify }) => {
    modify(baseClosure)
    await db.frnAgreementClosed.create(baseClosure)
    expect(await isAgreementClosed(paymentRequest)).toBe(false)
  })

  test('should return false if the value is non-zero', async () => {
    await db.frnAgreementClosed.create(baseClosure)
    paymentRequest.value = 1000
    expect(await isAgreementClosed(paymentRequest)).toBe(false)
  })
})
