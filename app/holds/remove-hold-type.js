const db = require('../data')

const removeHoldType = async (holdCategoryId, transaction) => {
  await db.holdCategory.destroy(
    {
      where: { holdCategoryId },
      transaction
    }
  )
}

module.exports = { removeHoldType }
