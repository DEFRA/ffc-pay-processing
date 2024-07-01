const db = require('../data')

const getTrackingPaymentRequests = async (limit) => {
  const transaction = await db.sequelize.transaction()
  try {
    const subquery = await db.sequelize.query(
      `SELECT DISTINCT ON ("frn") "paymentRequestId"
       FROM "paymentRequests"
       WHERE ("sentToTracking" = false OR "sentToTracking" IS NULL)
       AND (("received" <= :date) OR ("migrationId" IS NOT NULL))
       ORDER BY "frn", "paymentRequestId"
       LIMIT :limit`,
      {
        replacements: { date: new Date('2024-06-24'), limit },
        type: db.sequelize.QueryTypes.SELECT,
        transaction
      }
    )

    const paymentRequestIds = subquery.map(row => row.paymentRequestId)
    const prToSend = await db.paymentRequest.findAll({
      where: {
        paymentRequestId: {
          [db.Sequelize.Op.in]: paymentRequestIds
        }
      },
      include: [{
        model: db.completedPaymentRequest,
        as: 'completedPaymentRequests',
        required: false
      }, {
        model: db.invoiceLine,
        as: 'invoiceLines',
        required: false
      }],
      transaction
    })

    if (paymentRequestIds.length) {
      await db.paymentRequest.update(
        { sentToTracking: true },
        {
          where: {
            paymentRequestId: paymentRequestIds
          },
          transaction
        }
      )
    }
    await transaction.commit()
    return prToSend
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

module.exports = {
  getTrackingPaymentRequests
}
