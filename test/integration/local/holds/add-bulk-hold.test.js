const { closeDatabaseConnection, resetDatabase } = require('../../../helpers')
const { FRN } = require('../../../mocks/values/frn')

jest.mock('../../../../app/holds/add-hold')
const { addHold: mockAddHold } = require('../../../../app/holds/add-hold')

const { addBulkHold } = require('../../../../app/holds/add-bulk-hold')

describe('add bulk hold', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should call add hold once if file contains one entry', async () => {
    await addBulkHold([FRN], 1)
    expect(mockAddHold).toHaveBeenCalledTimes(1)
  })

  test('should call add hold multiple times if file contains multiple entry', async () => {
    await addBulkHold([FRN, 1234567891], 1)
    expect(mockAddHold).toHaveBeenCalledTimes(2)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
