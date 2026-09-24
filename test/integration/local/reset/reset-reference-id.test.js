const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

jest.mock('node:crypto')
const { randomUUID } = require('node:crypto')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/database')

const { resetReferenceId } = require('../../../../app/reset/reset-reference-id')

const UUID = '00000000-0000-0000-0000-000000000000'

let paymentRequestId

describe('reset reference id', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    randomUUID.mockReturnValue(UUID)
    await resetDatabase()
    const { id } = await savePaymentRequest(paymentRequest, false)
    paymentRequestId = id
  })

  test('should reset reference id with new UUID', async () => {
    await resetReferenceId(paymentRequestId)
    const updatedPaymentRequest = await db.paymentRequest().where({ paymentRequestId }).first()
    expect(updatedPaymentRequest.referenceId).toEqual(UUID)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
