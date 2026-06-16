jest.mock('../../../app/data', () => ({
  holdCategory: {
    create: jest.fn()
  }
}))
const db = require('../../../app/data')
const { addHoldType } = require('../../../app/holds')

describe('addHoldType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls holdCategory.create with name and schemeId and transaction', async () => {
    const name = 'Test Hold'
    const schemeId = 123
    const transaction = {}
    await addHoldType(name, schemeId, transaction)
    expect(db.holdCategory.create).toHaveBeenCalledWith({ name, schemeId }, { transaction })
  })
})
