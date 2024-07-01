jest.mock('../../../../../app/tracking-migration')
const { getTrackingPaymentRequests: mockGetTrackingPaymentRequests } = require('../../../../../app/tracking-migration')

const paymentRequest = require('../../../../mocks/payment-requests/sfi')

const { GET } = require('../../../../../app/constants/methods')

let server

describe('tracking migration routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockGetTrackingPaymentRequests.mockResolvedValue([paymentRequest])

    const { createServer } = require('../../../../../app/server/create-server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /tracking-migration returns payment requests if non-migrated payment requests', async () => {
    const options = {
      method: GET,
      url: '/tracking-migration'
    }

    const result = await server.inject(options)
    expect(result.result.paymentRequestsBatch[0]).toMatchObject(paymentRequest)
  })

  test('GET /tracking-migration returns 200 if payment requests', async () => {
    const options = {
      method: GET,
      url: '/tracking-migration'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /tracking-migration returns empty array if no payment requests', async () => {
    const options = {
      method: GET,
      url: '/tracking-migration'
    }

    mockGetTrackingPaymentRequests.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.result.paymentRequestsBatch).toEqual([])
  })

  test('GET /tracking-migration returns 200 if no schemes', async () => {
    const options = {
      method: GET,
      url: '/tracking-migration'
    }

    mockGetTrackingPaymentRequests.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })
})
