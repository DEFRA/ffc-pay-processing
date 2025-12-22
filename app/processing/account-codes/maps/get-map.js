const {
  SFI,
  SFI_PILOT,
  LUMP_SUMS,
  VET_VISITS,
  CS,
  BPS,
  SFI23,
  DELINKED,
  SFI_EXPANDED,
  COHT_REVENUE,
  COHT_CAPITAL
} = require('../../../constants/schemes')

const sfi = require('./sfi')
const lumpSums = require('./lump-sums')
const vetVisits = require('./vet-visits')
const cs = require('./cs')
const bps = require('./bps')
const delinked = require('./delinked')
const cohtr = require('./cohtr')
const cohtc = require('./cohtc')

const schemeMap = new Map([
  [SFI, sfi],
  [SFI_PILOT, sfi],
  [SFI23, sfi],
  [SFI_EXPANDED, sfi],
  [LUMP_SUMS, lumpSums],
  [VET_VISITS, vetVisits],
  [CS, cs],
  [BPS, bps],
  [DELINKED, delinked],
  [COHT_REVENUE, cohtr],
  [COHT_CAPITAL, cohtc]
])

const getMap = (schemeId) => {
  if (!schemeId) {
    throw new Error('schemeId is required')
  }

  const mapForScheme = schemeMap.get(schemeId)
  if (mapForScheme) {
    return mapForScheme
  }

  throw new Error(`No account codes found for scheme ${schemeId}`)
}

module.exports = {
  getMap
}
