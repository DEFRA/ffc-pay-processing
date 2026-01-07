const db = require('../../app/data')
const sfi = require('../mocks/schemes/sfi')
const sfip = require('../mocks/schemes/sfip')
const lumpSums = require('../mocks/schemes/lump-sums')
const vetVisits = require('../mocks/schemes/vet-visits')
const cs = require('../mocks/schemes/cs')
const bps = require('../mocks/schemes/bps')
const manual = require('../mocks/schemes/manual')
const sfi23 = require('../mocks/schemes/sfi23')
const delinked = require('../mocks/schemes/delinked')
const sfiExpanded = require('../mocks/schemes/sfi-expanded')
const cohtCapital = require('../mocks/schemes/coht-capital')
const cohtRevenue = require('../mocks/schemes/coht-revenue')
const { sfiHoldCategory, sfiPilotHoldCategory, manualLedgerHoldCategory, debtEnrichmentHoldCategory, sfiAutoHoldCategory, sfiPilotAutoHoldCategory, manualLedgerAutoHoldCategory, debtEnrichmentAutoHoldCategory } = require('../mocks/holds/hold-category')

const resetDatabase = async () => {
  await db.sequelize.truncate({ cascade: true })
  await db.scheme.bulkCreate([sfi, sfip, lumpSums, vetVisits, cs, bps, manual, sfi23, delinked, sfiExpanded, cohtRevenue, cohtCapital])
  await db.holdCategory.bulkCreate([sfiHoldCategory, sfiPilotHoldCategory, manualLedgerHoldCategory, debtEnrichmentHoldCategory])
  await db.autoHoldCategory.bulkCreate([sfiAutoHoldCategory, sfiPilotAutoHoldCategory, manualLedgerAutoHoldCategory, debtEnrichmentAutoHoldCategory])
}

module.exports = {
  resetDatabase
}
