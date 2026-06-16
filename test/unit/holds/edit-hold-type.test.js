jest.mock('../../../app/data', () => ({
  holdCategory: {
    update: jest.fn()
  }
}))
const db = require('../../../app/data')
const { editHoldType } = require('../../../app/holds')

describe('editHoldType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls holdCategory.update with name and where holdCategoryId and transaction', async () => {
    const name = 'Updated Hold'
    const holdCategoryId = 7
    const transaction = {}
    await editHoldType(name, holdCategoryId, transaction)
    expect(db.holdCategory.update).toHaveBeenCalledWith(
      { name },
      { where: { holdCategoryId }, transaction }
    )
  })
})
