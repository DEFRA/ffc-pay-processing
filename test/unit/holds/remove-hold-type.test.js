jest.mock('../../../app/data', () => ({
  holdCategory: {
    destroy: jest.fn()
  }
}))
const db = require('../../../app/data')
const { removeHoldType } = require('../../../app/holds')

describe('removeHoldType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls holdCategory.destroy with where holdCategoryId and transaction', async () => {
    const holdCategoryId = 9
    const transaction = {}
    await removeHoldType(holdCategoryId, transaction)
    expect(db.holdCategory.destroy).toHaveBeenCalledWith(
      { where: { holdCategoryId }, transaction }
    )
  })
})
