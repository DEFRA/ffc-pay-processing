const {
  SFI, SFI_PILOT, LUMP_SUMS, VET_VISITS, CS, BPS, FDMR, SFI23, DELINKED, SFI_EXPANDED
} = require('../../../../../app/constants/schemes')

const sfiMap = require('../../../../../app/processing/account-codes/maps/sfi')
const lumpSumsMap = require('../../../../../app/processing/account-codes/maps/lump-sums')
const vetVisitsMap = require('../../../../../app/processing/account-codes/maps/vet-visits')
const csMap = require('../../../../../app/processing/account-codes/maps/cs')
const bpsMap = require('../../../../../app/processing/account-codes/maps/bps')
const fdmrMap = require('../../../../../app/processing/account-codes/maps/fdmr')
const delinkedMap = require('../../../../../app/processing/account-codes/maps/delinked')

const { getMap } = require('../../../../../app/processing/account-codes/maps/get-map')

describe('get map', () => {
  test.each([
    [SFI, sfiMap],
    [SFI_PILOT, sfiMap],
    [LUMP_SUMS, lumpSumsMap],
    [VET_VISITS, vetVisitsMap],
    [CS, csMap],
    [BPS, bpsMap],
    [FDMR, fdmrMap],
    [SFI23, sfiMap],
    [DELINKED, delinkedMap],
    [SFI_EXPANDED, sfiMap]
  ])('should return correct map for scheme %s', (scheme, expectedMap) => {
    expect(getMap(scheme)).toStrictEqual(expectedMap)
  })

  test('should throw error for unknown scheme', () => {
    expect(() => getMap('1234A')).toThrow(new Error('No account codes found for scheme 1234A'))
  })
})
