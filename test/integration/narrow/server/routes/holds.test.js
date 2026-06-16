jest.mock('../../../../../app/holds')
const { getHolds: mockGetHolds, addHold: mockAddHold, removeHoldById: mockRemoveHoldById, getHoldCategories: mockGetHoldCategories, addHoldType: mockAddHoldType, editHoldType: mockEditHoldType, removeHoldType: mockRemoveHoldType } = require('../../../../../app/holds')
const hold = require('../../../../mocks/holds/hold')
const holdCategory = require('../../../../mocks/holds/hold-category')

const { GET, POST } = require('../../../../../app/constants/methods')

const holdId = 1

let server

describe('holds routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks()

    mockGetHolds.mockResolvedValue([hold])
    mockGetHoldCategories.mockResolvedValue([holdCategory])

    const { createServer } = require('../../../../../app/server/create-server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /payment-holds returns holds if holds', async () => {
    const options = {
      method: GET,
      url: '/payment-holds'
    }

    const result = await server.inject(options)
    expect(result.result.paymentHolds[0]).toMatchObject(hold)
  })

  test('GET /payment-holds returns 200 if holds', async () => {
    const options = {
      method: GET,
      url: '/payment-holds'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /payment-holds returns empty array if no holds', async () => {
    const options = {
      method: GET,
      url: '/payment-holds'
    }

    mockGetHolds.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.result.paymentHolds).toEqual([])
  })

  test('GET /payment-holds returns 200 if no holds', async () => {
    const options = {
      method: GET,
      url: '/payment-holds'
    }

    mockGetHolds.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /payment-hold-categories returns hold categories if hold categories', async () => {
    const options = {
      method: GET,
      url: '/payment-hold-categories'
    }

    const result = await server.inject(options)
    expect(result.result.paymentHoldCategories[0]).toMatchObject(holdCategory)
  })

  test('GET /payment-hold-categories returns 200 if hold categories', async () => {
    const options = {
      method: GET,
      url: '/payment-hold-categories'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /payment-hold-categories returns empty array if no hold categories', async () => {
    const options = {
      method: GET,
      url: '/payment-hold-categories'
    }

    mockGetHoldCategories.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.result.paymentHoldCategories).toEqual([])
  })

  test('GET /payment-hold-categories returns 200 if no hold categories', async () => {
    const options = {
      method: GET,
      url: '/payment-hold-categories'
    }

    mockGetHoldCategories.mockResolvedValue([])

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('POST /add-payment-hold should add hold for FRN and category', async () => {
    const options = {
      method: POST,
      url: '/add-payment-hold',
      payload: {
        frn: hold.frn,
        holdCategoryId: hold.holdCategoryId
      }
    }

    await server.inject(options)
    expect(mockAddHold).toHaveBeenCalledWith(hold.frn, hold.holdCategoryId)
  })

  test('POST /add-payment-hold returns 200 if hold added', async () => {
    const options = {
      method: POST,
      url: '/add-payment-hold',
      payload: {
        frn: hold.frn,
        holdCategoryId: hold.holdCategoryId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test.each([
    'abc',
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /add-payment-hold returns 400 if FRN is %p', async (frn) => {
    const options = {
      method: POST,
      url: '/add-payment-hold',
      payload: {
        frn,
        holdCategoryId: hold.holdCategoryId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test.each([
    'abc',
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /add-payment-hold returns 400 if hold category id is %p', async (holdCategoryId) => {
    const options = {
      method: POST,
      url: '/add-payment-hold',
      payload: {
        frn: hold.frn,
        holdCategoryId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('POST /add-payment-hold returns 500 if hold cannot be created', async () => {
    mockAddHold.mockRejectedValue(new Error('Test error'))

    const options = {
      method: POST,
      url: '/add-payment-hold',
      payload: {
        frn: hold.frn,
        holdCategoryId: hold.holdCategoryId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(500)
  })

  test('POST /remove-payment-hold should remove hold for hold id', async () => {
    const options = {
      method: POST,
      url: '/remove-payment-hold',
      payload: {
        holdId
      }
    }

    await server.inject(options)
    expect(mockRemoveHoldById).toHaveBeenCalledWith(holdId)
  })

  test('POST /remove-payment-hold returns 200 if hold removed', async () => {
    const options = {
      method: POST,
      url: '/remove-payment-hold',
      payload: {
        holdId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test.each([
    'abc',
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /remove-payment-hold returns 400 if hold id is %p', async (holdId) => {
    const options = {
      method: POST,
      url: '/remove-payment-hold',
      payload: {
        holdId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('POST /remove-payment-hold returns 500 if hold cannot be removed', async () => {
    mockRemoveHoldById.mockRejectedValue(new Error('Test error'))
    const options = {
      method: POST,
      url: '/remove-payment-hold',
      payload: {
        holdId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(500)
  })

  // add-hold-type
  test('POST /add-hold-type should add hold type for category and scheme', async () => {
    const options = {
      method: POST,
      url: '/add-hold-type',
      payload: {
        categoryName: 'Test Category',
        schemeId: 2
      }
    }

    await server.inject(options)
    expect(mockAddHoldType).toHaveBeenCalledWith('Test Category', 2)
  })

  test('POST /add-hold-type returns 200 if hold type added', async () => {
    const options = {
      method: POST,
      url: '/add-hold-type',
      payload: {
        categoryName: 'Test Category',
        schemeId: 2
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test.each([
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /add-hold-type returns 400 if categoryName is %p', async (categoryName) => {
    const options = {
      method: POST,
      url: '/add-hold-type',
      payload: {
        categoryName,
        schemeId: 2
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test.each([
    'abc',
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /add-hold-type returns 400 if schemeId is %p', async (schemeId) => {
    const options = {
      method: POST,
      url: '/add-hold-type',
      payload: {
        categoryName: 'Test Category',
        schemeId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('POST /edit-hold-type should edit hold type', async () => {
    const options = {
      method: POST,
      url: '/edit-hold-type',
      payload: {
        categoryName: 'Edited Category',
        holdCategoryId: 3
      }
    }

    await server.inject(options)
    expect(mockEditHoldType).toHaveBeenCalledWith('Edited Category', 3)
  })

  test('POST /edit-hold-type returns 200 if hold type edited', async () => {
    const options = {
      method: POST,
      url: '/edit-hold-type',
      payload: {
        categoryName: 'Edited Category',
        holdCategoryId: 3
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test.each([
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /edit-hold-type returns 400 if categoryName is %p', async (categoryName) => {
    const options = {
      method: POST,
      url: '/edit-hold-type',
      payload: {
        categoryName,
        holdCategoryId: 3
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test.each([
    'abc',
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /edit-hold-type returns 400 if holdCategoryId is %p', async (holdCategoryId) => {
    const options = {
      method: POST,
      url: '/edit-hold-type',
      payload: {
        categoryName: 'Edited Category',
        holdCategoryId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('POST /remove-hold-type should remove hold type for holdCategoryId', async () => {
    const options = {
      method: POST,
      url: '/remove-hold-type',
      payload: {
        holdCategoryId: 5
      }
    }

    await server.inject(options)
    expect(mockRemoveHoldType).toHaveBeenCalledWith(5)
  })

  test('POST /remove-hold-type returns 200 if hold type removed', async () => {
    const options = {
      method: POST,
      url: '/remove-hold-type',
      payload: {
        holdCategoryId: 5
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test.each([
    'abc',
    false,
    true,
    undefined,
    null,
    ''
  ])('POST /remove-hold-type returns 400 if holdCategoryId is %p', async (holdCategoryId) => {
    const options = {
      method: POST,
      url: '/remove-hold-type',
      payload: {
        holdCategoryId
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('POST /remove-hold-type returns 500 if removal throws', async () => {
    mockRemoveHoldType.mockRejectedValue(new Error('Test error'))
    const options = {
      method: POST,
      url: '/remove-hold-type',
      payload: {
        holdCategoryId: 5
      }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(500)
  })
})
