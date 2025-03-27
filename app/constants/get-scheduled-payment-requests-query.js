const { BPS } = require('./schemes')

module.exports = `
  WITH "plannedSchedules" AS (
    SELECT DISTINCT ON ("paymentRequests"."frn", "paymentRequests"."schemeId", "paymentRequests"."marketingYear", "paymentRequests"."agreementNumber")
      "schedule"."scheduleId",
      "paymentRequests"."frn",
      "paymentRequests"."schemeId",
      "paymentRequests"."marketingYear",
      "paymentRequests"."agreementNumber",
      "paymentRequests"."contractNumber",
      "paymentRequests"."paymentRequestNumber"
    FROM 
      "schedule"
    INNER JOIN 
      "paymentRequests" ON "schedule"."paymentRequestId" = "paymentRequests"."paymentRequestId"
    INNER JOIN 
      "schemes" ON "paymentRequests"."schemeId" = "schemes"."schemeId"
    INNER JOIN 
      "invoiceLines" ON "paymentRequests"."paymentRequestId" = "invoiceLines"."paymentRequestId"
    WHERE 
      "schemes"."active" = true
      AND "schedule"."planned" <= NOW()
      AND "schedule"."completed" IS NULL
      AND ("schedule"."started" IS NULL OR "schedule"."started" <= NOW() - INTERVAL '5 minutes')
      AND NOT EXISTS (
        SELECT 1
        FROM 
          "holds"
        INNER JOIN 
          "holdCategories" ON "holds"."holdCategoryId" = "holdCategories"."holdCategoryId"
        WHERE "holds"."closed" IS NULL
        AND "paymentRequests"."frn" = "holds"."frn"
        AND "schemes"."schemeId" = "holdCategories"."schemeId"
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "autoHolds"
        INNER JOIN "autoHoldCategories"
          ON "autoHolds"."autoHoldCategoryId" = "autoHoldCategories"."autoHoldCategoryId"
        WHERE "autoHolds"."closed" IS NULL
        AND "paymentRequests"."frn" = "autoHolds"."frn"
        AND "schemes"."schemeId" = "autoHoldCategories"."schemeId"
        AND "paymentRequests"."marketingYear" = "autoHolds"."marketingYear"
        AND (
          "schemes"."schemeId" = ${BPS}
          OR (
            ("autoHolds"."agreementNumber" IS NULL OR "paymentRequests"."agreementNumber" = "autoHolds"."agreementNumber")
            AND ("autoHolds"."contractNumber" IS NULL OR "paymentRequests"."contractNumber" = "autoHolds"."contractNumber")
          )
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "schedule" "s2"
        INNER JOIN "paymentRequests" "p2"
        ON "s2"."paymentRequestId" = "p2"."paymentRequestId"
        WHERE
          "paymentRequests"."frn" = "p2"."frn"
          AND "paymentRequests"."schemeId" = "p2"."schemeId"
          AND "paymentRequests"."marketingYear" = "p2"."marketingYear"
          AND "paymentRequests"."agreementNumber" = "p2"."agreementNumber"
          AND "paymentRequests"."contractNumber" = "p2"."contractNumber"
          AND "s2"."started" > NOW() - INTERVAL '5 minutes'
          AND "s2"."completed" IS NULL
      )
    ORDER BY
      "paymentRequests"."frn",
      "paymentRequests"."schemeId",
      "paymentRequests"."marketingYear",
      "paymentRequests"."agreementNumber",
      "paymentRequests"."contractNumber",
      "paymentRequests"."paymentRequestNumber",
      "schedule"."planned"
    LIMIT :processingCap
  )
  UPDATE "schedule"
  SET "started" = NOW()
  FROM "plannedSchedules"
  WHERE "schedule"."scheduleId" = "plannedSchedules"."scheduleId"
  RETURNING "schedule"."scheduleId"
`
