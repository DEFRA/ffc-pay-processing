const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const { getSchemes } = require('../../../../app/schemes/get-schemes')

describe('get schemes', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should return all schemes that exist', async () => {
    const schemes = await getSchemes()
    expect(schemes.length).toBe(13)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
