const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['hold', 'autoHold'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getHolds } = require('../../../app/holds/get-holds')

describe('getHolds', () => {
  let holdsBuilder
  let autoHoldsBuilder

  const mockResults = (holds, autoHolds) => {
    holdsBuilder.resolves(holds)
    autoHoldsBuilder.resolves(autoHolds)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    holdsBuilder = createQueryBuilder()
    autoHoldsBuilder = createQueryBuilder()
    mockDb.tables.hold.mockReturnValue(holdsBuilder)
    mockDb.tables.autoHold.mockReturnValue(autoHoldsBuilder)
  })

  test('should return merged results of holds and autoHolds', async () => {
    const holds = [{ holdId: 1, frn: 123 }]
    const autoHolds = [{ holdId: 2, frn: 456 }]
    mockResults(holds, autoHolds)

    const result = await getHolds({
      pageNumber: undefined,
      pageSize: undefined
    })

    expect(result).toEqual([...holds, ...autoHolds])
  })

  test('should join holds to hold categories and schemes', async () => {
    mockResults([], [])

    await getHolds({})

    expect(holdsBuilder.leftJoin).toHaveBeenCalledWith('holdCategories', 'holds.holdCategoryId', 'holdCategories.holdCategoryId')
    expect(holdsBuilder.leftJoin).toHaveBeenCalledWith('schemes', 'holdCategories.schemeId', 'schemes.schemeId')
  })

  test('should join auto holds to auto hold categories and schemes', async () => {
    mockResults([], [])

    await getHolds({})

    expect(autoHoldsBuilder.leftJoin).toHaveBeenCalledWith('autoHoldCategories', 'autoHolds.autoHoldCategoryId', 'autoHoldCategories.autoHoldCategoryId')
    expect(autoHoldsBuilder.leftJoin).toHaveBeenCalledWith('schemes', 'autoHoldCategories.schemeId', 'schemes.schemeId')
  })

  test('should only return open holds by default', async () => {
    mockResults([], [])

    await getHolds({})

    expect(holdsBuilder.whereNull).toHaveBeenCalledWith('holds.closed')
    expect(autoHoldsBuilder.whereNull).toHaveBeenCalledWith('autoHolds.closed')
  })

  test('should not filter on closed if open only not requested', async () => {
    mockResults([], [])

    await getHolds({}, false)

    expect(holdsBuilder.whereNull).not.toHaveBeenCalled()
    expect(autoHoldsBuilder.whereNull).not.toHaveBeenCalled()
  })

  test('should paginate results if pageNumber and pageSize are provided', async () => {
    const holds = [{ holdId: 1, frn: 123 }]
    const autoHolds = [{ holdId: 2, frn: 456 }]
    mockResults(holds, autoHolds)

    const result = await getHolds({
      pageNumber: 1,
      pageSize: 1
    })

    expect(result).toEqual([{ holdId: 1, frn: 123 }])
  })

  test('should return empty array if no holds or autoHolds found', async () => {
    mockResults([], [])

    const result = await getHolds({
      pageNumber: undefined,
      pageSize: undefined
    })

    expect(result).toEqual([])
  })

  test('should handle invalid pageNumber and pageSize gracefully', async () => {
    const holds = [{ holdId: 1, frn: 123 }]
    const autoHolds = [{ holdId: 2, frn: 456 }]
    mockResults(holds, autoHolds)

    const result = await getHolds({
      pageNumber: 'invalid',
      pageSize: 'invalid'
    })

    expect(result).toEqual([...holds, ...autoHolds])
  })
})
