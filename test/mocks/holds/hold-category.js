const { SFI, SFI_PILOT } = require('../../../app/constants/schemes')

module.exports = {
  sfiHoldCategory: {
    holdCategoryId: 1,
    schemeId: SFI,
    name: 'SFI Hold category'
  },
  sfiPilotHoldCategory: {
    holdCategoryId: 2,
    schemeId: SFI_PILOT,
    name: 'SFI Pilot Hold category'
  },
  manualLedgerHoldCategory: {
    holdCategoryId: 3,
    schemeId: SFI,
    name: 'Manual Ledger hold'
  },
  debtEnrichmentHoldCategory: {
    holdCategoryId: 4,
    schemeId: SFI,
    name: 'Awaiting debt enrichment'
  }
}
