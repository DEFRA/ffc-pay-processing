const db = require('../data')

const editHoldType = async (name, holdCategoryId, transaction) => {
  await db.holdCategory.update(
    {
      name
    },
    {
      where: { holdCategoryId },
      transaction
    }
  )
}

module.exports = { editHoldType }
