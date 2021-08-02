const db = require('../data')

const completeBatch = async (batchId) => {
  const transaction = await db.sequelize.transaction()
  try {
    const batch = await db.batch.findByPk(batchId, { transaction })

    // Check if completed already in case of duplicate processing
    if (batch.published === null) {
      await db.schedule.update({ published: new Date() }, { where: { batchId }, transaction })
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = completeBatch