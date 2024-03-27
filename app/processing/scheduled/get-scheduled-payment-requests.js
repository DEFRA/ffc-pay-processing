const moment = require('moment')
const db = require('../../data')
const { processingConfig } = require('../../config')

const getScheduledPaymentRequests = async (started, transaction) => {
  // This is written as a raw query for performance reasons
  // Also need to exclude holds whilst limiting WIP of processing to avoid deadlocks
  const schedules = await db.sequelize.query(`
    SELECT
      "schedule".*
    FROM "schedule"
    INNER JOIN "paymentRequests"
      ON "schedule"."paymentRequestId" = "paymentRequests"."paymentRequestId"
    INNER JOIN "schemes"
      ON "paymentRequests"."schemeId" = "schemes"."schemeId"
    INNER JOIN "invoiceLines"
      ON "paymentRequests"."paymentRequestId" = "invoiceLines"."paymentRequestId"
    LEFT JOIN (
      SELECT
        "holds"."holdId" AS "holdId",
        "holds"."frn" AS "frn",
        "holdCategories"."schemeId" AS "schemeId"
      FROM "holds"
      INNER JOIN "holdCategories"
        ON "holds"."holdCategoryId" = "holdCategories"."holdCategoryId"
      WHERE "holds"."closed" IS NULL
    ) AS "holds"
      ON "paymentRequests"."frn" = "holds"."frn"
      AND "schemes"."schemeId" = "holds"."schemeId"
    LEFT JOIN (
      SELECT
        "autoHolds"."autoHoldId" AS "autoHoldId",
        "autoHolds"."frn" AS "frn",
        "autoHolds"."marketingYear" AS "marketingYear",
        "autoHoldCategories"."schemeId" AS "schemeId"
      FROM "autoHolds"
      INNER JOIN "autoHoldCategories"
        ON "autoHolds"."autoHoldCategoryId" = "autoHoldCategories"."autoHoldCategoryId"
      WHERE "autoHolds"."closed" IS NULL
    ) AS "autoHolds"
      ON "paymentRequests"."frn" = "autoHolds"."frn"
      AND "schemes"."schemeId" = "autoHolds"."schemeId"
      AND "paymentRequests"."marketingYear" = "autoHolds"."marketingYear"
    WHERE "schemes"."active" = true
      AND "schedule"."planned" <= :started
      AND "schedule"."completed" IS NULL
      AND ("schedule"."started" IS NULL OR "schedule"."started" <= :delay)
      AND "holds"."holdId" IS NULL
      AND "autoHolds"."autoHoldId" IS NULL
    ORDER BY "paymentRequests"."paymentRequestNumber", "schedule"."planned"
    LIMIT :processingCap
    FOR UPDATE OF "schedule" SKIP LOCKED
    `, {
    replacements: {
      started,
      delay: moment(started).subtract(5, 'minutes').toDate(),
      processingCap: processingConfig.processingCap
    },
    transaction,
    type: db.Sequelize.QueryTypes.SELECT,
    raw: true
  })

  const scheduledPaymentRequests = await db.schedule.findAll({
    transaction,
    include: [{
      model: db.paymentRequest,
      as: 'paymentRequest',
      include: [{
        model: db.invoiceLine,
        as: 'invoiceLines',
        required: true,
        where: {
          invalid: { [db.Sequelize.Op.ne]: true }
        }
      }, {
        model: db.scheme,
        as: 'scheme'
      }]
    }],
    where: {
      scheduleId: {
        [db.Sequelize.Op.in]: [...schedules.map(x => x.scheduleId)]
      }
    }
  })

  return scheduledPaymentRequests.map(x => x.get({ plain: true })).filter(x => x.paymentRequest)
}

module.exports = {
  getScheduledPaymentRequests
}
