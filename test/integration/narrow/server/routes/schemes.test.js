jest.mock('../../../../../app/schemes')
const { getSchemes: mockGetSchemes } = require('../../../../../app/schemes')

const scheme = require('../../../../mocks/schemes/scheme')

const { GET } = require('../../../../../app/constants/methods')

let server

describe('scheme routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks()

    mockGetSchemes.mockResolvedValue([scheme])

    const { createServer } = require('../../../../../app/server/create-server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /payment-schemes returns schemes if schemes', async () => {
    const options = {
      method: GET,
      url: '/payment-schemes'
    }

    const result = await server.inject(options)
    expect(result.result.paymentSchemes[0]).toMatchObject(scheme)
  })

  test('GET /payment-schemes returns 200 if schemes', async () => {
    const options = {
      method: GET,
      url: '/payment-schemes'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /payment-schemes returns empty array if no schemes', async () => {
    const options = {
      method: GET,
      url: '/payment-schemes'
    }

    mockGetSchemes.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.result.paymentSchemes).toEqual([])
  })

  test('GET /payment-schemes returns 200 if no schemes', async () => {
    const options = {
      method: GET,
      url: '/payment-schemes'
    }

    mockGetSchemes.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })
})
