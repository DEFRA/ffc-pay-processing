const { SFI, SFI_PILOT, LUMP_SUMS, VET_VISITS, CS, BPS, FDMR, SFI23, DELINKED, SFI_EXPANDED } = require('../../../../../app/constants/schemes')

const sfiMap = require('../../../../../app/processing/account-codes/maps/sfi')
const lumpSumsMap = require('../../../../../app/processing/account-codes/maps/lump-sums')
const vetVisitsMap = require('../../../../../app/processing/account-codes/maps/vet-visits')
const csMap = require('../../../../../app/processing/account-codes/maps/cs')
const bpsMap = require('../../../../../app/processing/account-codes/maps/bps')
const fdmrMap = require('../../../../../app/processing/account-codes/maps/fdmr')
const delinkedMap = require('../../../../../app/processing/account-codes/maps/delinked')

const { getMap } = require('../../../../../app/processing/account-codes/maps/get-map')

describe('get map', () => {
  test('should return SFI map for SFI', () => {
    const map = getMap(SFI)
    expect(map).toStrictEqual(sfiMap)
  })

  test('should return SFI map for SFI pilot', () => {
    const map = getMap(SFI_PILOT)
    expect(map).toStrictEqual(sfiMap)
  })

  test('should return lump sums map for lump sums', () => {
    const map = getMap(LUMP_SUMS)
    expect(map).toStrictEqual(lumpSumsMap)
  })

  test('should return vet visits map for vet visits', () => {
    const map = getMap(VET_VISITS)
    expect(map).toStrictEqual(vetVisitsMap)
  })

  test('should return CS map for CS', () => {
    const map = getMap(CS)
    expect(map).toStrictEqual(csMap)
  })

  test('should return BPS map for BPS', () => {
    const map = getMap(BPS)
    expect(map).toStrictEqual(bpsMap)
  })

  test('should return FDMR map for FDMR', () => {
    const map = getMap(FDMR)
    expect(map).toStrictEqual(fdmrMap)
  })

  test('should return SFI map for SFI 23', () => {
    const map = getMap(SFI23)
    expect(map).toStrictEqual(sfiMap)
  })

  test('should return Delinked map for Delinked Payments', () => {
    const map = getMap(DELINKED)
    expect(map).toStrictEqual(delinkedMap)
  })

  test('should return SFI map for SFI Expanded', () => {
    const map = getMap(SFI_EXPANDED)
    expect(map).toStrictEqual(sfiMap)
  })
  test('should throw error for unknown scheme', () => {
    expect(() => getMap('1234A')).toThrow(new Error('No account codes found for scheme 1234A'))
  })
})
