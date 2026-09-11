const { getSchemes, schemeDoesNotRequirePPAs } = require('ffc-pay-schemes')
const db = require('./data')
const { addHoldType } = require('./holds')
const { BANK_ACCOUNT_ANOMALY, DAX_REJECTION, AWAITING_DEBT_ENRICHMENT, AWAITING_LEDGER_CHECK } = require('./constants/hold-categories-names')

const updateSchemesDatabase = async () => {
  console.log('Checking for updates to supported schemes')
  const schemes = getSchemes()

  for (const { schemeId, schemeName, sourceSystem } of schemes) {
    const [, created] = await db.scheme.upsert({
      schemeId,
      name: schemeName,
      sourceSystem
    })
    console.log(`${schemeName} ${created ? 'created' : 'updated'}`)
    if (created) {
      // A new scheme also requires the two mandatory D365 related hold categories to be set up.
      await addHoldType(BANK_ACCOUNT_ANOMALY, schemeId)
      await addHoldType(DAX_REJECTION, schemeId)
      console.log('Required D365 holds added')
      // If the scheme supports PPAs, we also need the Request Editor hold categories
      if (!schemeDoesNotRequirePPAs(schemeId)) {
        await addHoldType(AWAITING_DEBT_ENRICHMENT, schemeId)
        await addHoldType(AWAITING_LEDGER_CHECK, schemeId)
        console.log('Scheme supports PPAs - required Request Editor holds added')
      }
    }
  }
}

module.exports = {
  updateSchemesDatabase
}
