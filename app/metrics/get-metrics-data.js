const db = require('../../app/data')
const schemes = require('../../app/constants/schemes')
const { buildMetricsQuery, buildQueryWhereClausesAndReplacements } = require('./build-metrics')
const {
  MILLISECONDS_PER_DAY
} = require('../../app/constants/time')
const {
  FIRST_DAY_OF_MONTH
} = require('../../app/constants/date')
const {
  PERIOD_ALL
} = require('../../app/constants/periods')

const getSchemeNameById = (schemeId) => {
  const schemeEntry = Object.entries(schemes).find(([, id]) => id === schemeId)
  return schemeEntry ? schemeEntry[0] : null
}

const getDateRangeForAll = () => ({
  startDate: null,
  endDate: null
})

const getDateRangeForYTD = (now) => ({
  startDate: new Date(now.getFullYear(), 0, FIRST_DAY_OF_MONTH),
  endDate: null
})

const getDateRangeForYear = (year) => ({
  startDate: new Date(year, 0, 1),
  endDate: new Date(year + 1, 0, 1),
  year
})

const getDateRangeForMonthInYear = (year, month) => {
  const endDate = month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1)
  return {
    startDate: new Date(year, month - 1, 1),
    endDate,
    year,
    month
  }
}

const getDateRangeForRelativePeriod = (now, days) => ({
  startDate: new Date(now.getTime() - days * MILLISECONDS_PER_DAY),
  endDate: null
})

const fetchMetricsData = async (whereClause, _year = null, _month = null, period = null) => {
  const { whereClauses, replacements } = buildQueryWhereClausesAndReplacements(whereClause)
  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  let groupByYearMonth = true
  if (period === PERIOD_ALL) {
    groupByYearMonth = false
  }
  const metricsQuery = buildMetricsQuery(whereSQL, groupByYearMonth)
  return db.sequelize.query(metricsQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
    raw: true
  })
}

const fetchHoldsData = async (whereClause) => {
  const schemeWhereClause = whereClause
  const holdsQuery = `
        SELECT 
            EXTRACT(YEAR FROM pr."received") AS "year",
            EXTRACT(MONTH FROM pr."received") AS "month",
            pr."schemeId",
            COUNT(DISTINCT pr."paymentRequestId") as "paymentsOnHold",
            COALESCE(SUM(pr."value"), 0) as "valueOnHold"
        FROM "paymentRequests" pr
        INNER JOIN "holds" h ON pr."frn" = h."frn"
        INNER JOIN "holdCategories" hc ON h."holdCategoryId" = hc."holdCategoryId"
        WHERE h."closed" IS NULL
          AND hc."schemeId" = pr."schemeId"
          ${schemeWhereClause.received?.[db.Sequelize.Op.gte] ? 'AND pr."received" >= :startDate' : ''}
          ${schemeWhereClause.received?.[db.Sequelize.Op.lt] ? 'AND pr."received" < :endDate' : ''}
        GROUP BY "year", "month", pr."schemeId"
    `
  const replacements = {}
  if (schemeWhereClause.received?.[db.Sequelize.Op.gte]) {
    replacements.startDate = schemeWhereClause.received[db.Sequelize.Op.gte]
  }
  if (schemeWhereClause.received?.[db.Sequelize.Op.lt]) {
    replacements.endDate = schemeWhereClause.received[db.Sequelize.Op.lt]
  }
  return db.sequelize.query(holdsQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
    raw: true
  })
}

const mergeMetricsWithHolds = (metricsResults, holdsResults) => {
  const holdsMap = new Map(holdsResults.map(h => [`${h.schemeId}-${h.year}-${h.month}`, h]))
  return metricsResults.map(metric => {
    const key = `${metric.schemeId}-${metric.year}-${metric.month}`
    const holdData = holdsMap.get(key)
    return {
      ...metric,
      paymentsOnHold: holdData ? Number.parseInt(holdData.paymentsOnHold) : 0,
      valueOnHold: holdData ? Number.parseInt(holdData.valueOnHold) : 0
    }
  })
}

module.exports = {
  getSchemeNameById,
  getDateRangeForAll,
  getDateRangeForYTD,
  getDateRangeForYear,
  getDateRangeForMonthInYear,
  getDateRangeForRelativePeriod,
  fetchMetricsData,
  fetchHoldsData,
  mergeMetricsWithHolds
}
