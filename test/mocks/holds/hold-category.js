const { SFI, SFI_PILOT } = require('../../../app/constants/schemes')
const { AWAITING_LEDGER_CHECK, AWAITING_DEBT_ENRICHMENT } = require('../../../app/constants/hold-categories-names')

module.exports = {
  sfiHoldCategory: {
    holdCategoryId: 1,
    schemeId: SFI,
    name: 'SFI Hold category'
  },
  sfiAutoHoldCategory: {
    autoHoldCategoryId: 1,
    schemeId: SFI,
    name: 'SFI Hold category'
  },
  sfiPilotHoldCategory: {
    holdCategoryId: 2,
    schemeId: SFI_PILOT,
    name: 'SFI Pilot Hold category'
  },
  sfiPilotAutoHoldCategory: {
    autoHoldCategoryId: 2,
    schemeId: SFI_PILOT,
    name: 'SFI Pilot Hold category'
  },
  manualLedgerHoldCategory: {
    holdCategoryId: 3,
    schemeId: SFI,
    name: AWAITING_LEDGER_CHECK
  },
  manualLedgerAutoHoldCategory: {
    autoHoldCategoryId: 3,
    schemeId: SFI,
    name: AWAITING_LEDGER_CHECK
  },
  debtEnrichmentHoldCategory: {
    holdCategoryId: 4,
    schemeId: SFI,
    name: AWAITING_DEBT_ENRICHMENT
  },
  debtEnrichmentAutoHoldCategory: {
    autoHoldCategoryId: 4,
    schemeId: SFI,
    name: AWAITING_DEBT_ENRICHMENT
  }
}
