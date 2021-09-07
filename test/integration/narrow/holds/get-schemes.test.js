const db = require('../../../../app/data')
jest.mock('ffc-messaging')
let createServer
let server
let scheme

describe('schemes routes', () => {
  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true })

    scheme = {
      schemeId: 1,
      name: 'SFI',
      active: true
    }

    createServer = require('../../../../app/server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /payment-schemes returns schemes', async () => {
    const options = {
      method: 'GET',
      url: '/payment-schemes'
    }

    await db.scheme.create(scheme)

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('POST /change-payment-status changes status to active false', async () => {
    const options = {
      method: 'POST',
      url: '/change-payment-status',
      payload: {
        schemeId: 1,
        active: false
      }
    }

    await db.scheme.create(scheme)

    const result = await server.inject(options)
    const updatedScheme = await db.scheme.findByPk(1)
    expect(result.statusCode).toBe(200)
    expect(updatedScheme.active).toBeFalsy()
  })

  test('POST /change-payment-status changes status to active', async () => {
    const options = {
      method: 'POST',
      url: '/change-payment-status',
      payload: {
        schemeId: 1,
        active: true
      }
    }

    scheme.active = false
    await db.scheme.create(scheme)

    const result = await server.inject(options)
    const updatedScheme = await db.scheme.findByPk(1)
    expect(result.statusCode).toBe(200)
    expect(updatedScheme.active).toBeTruthy()
  })
})
