const { Op } = require('sequelize')

const buildWhereClauseForDateRange = (startDate, endDate) => {
  const whereClause = {}
  if (startDate && endDate) {
    whereClause.received = {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    }
  }
  return whereClause
}

const buildQueryWhereClausesAndReplacements = (schemeWhereClause) => {
  const whereClauses = []
  const replacements = {}
  if (schemeWhereClause.received) {
    whereClauses.push(
      'pr."received" >= :startDate',
      'pr."received" < :endDate'
    )
    replacements.startDate = schemeWhereClause.received[Op.gte]
    replacements.endDate = schemeWhereClause.received[Op.lt]
  }
  return { whereClauses, replacements }
}

const buildMetricsQuery = (whereSQL, groupByYearMonth = true) => {
  return `
    SELECT 
      ${groupByYearMonth ? 'EXTRACT(YEAR FROM pr."received") AS "year",' : ''}
      ${groupByYearMonth ? 'EXTRACT(MONTH FROM pr."received") AS "month",' : ''}
      pr."schemeId",
      COUNT(pr."paymentRequestId") as "totalPayments",
      COALESCE(SUM(pr."value"), 0) as "totalValue",
      COUNT(CASE WHEN NOT EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN 1 END) as "pendingPayments",
      COALESCE(SUM(CASE WHEN NOT EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN pr."value" ELSE 0 END), 0) as "pendingValue",
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN 1 END) as "processedPayments",
      COALESCE(SUM(CASE WHEN EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN pr."value" ELSE 0 END), 0) as "processedValue",
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM "completedPaymentRequests" cpr 
        WHERE cpr."paymentRequestId" = pr."paymentRequestId" 
        AND cpr."invalid" = false
        AND cpr."lastSettlement" IS NOT NULL
      ) THEN 1 END) as "settledPayments",
      COALESCE(SUM(CASE WHEN EXISTS (
        SELECT 1 FROM "completedPaymentRequests" cpr 
        WHERE cpr."paymentRequestId" = pr."paymentRequestId" 
        AND cpr."invalid" = false
        AND cpr."lastSettlement" IS NOT NULL
      ) THEN (
        SELECT cpr2."settledValue" 
        FROM "completedPaymentRequests" cpr2 
        WHERE cpr2."paymentRequestId" = pr."paymentRequestId" 
        AND cpr2."invalid" = false
        AND cpr2."lastSettlement" IS NOT NULL
        LIMIT 1
      ) ELSE 0 END), 0) as "settledValue"
    FROM "paymentRequests" pr
    ${whereSQL}
    GROUP BY ${groupByYearMonth ? '"year", "month", ' : ''}pr."schemeId"
  `
}

module.exports = {
  buildWhereClauseForDateRange,
  buildQueryWhereClausesAndReplacements,
  buildMetricsQuery
}
