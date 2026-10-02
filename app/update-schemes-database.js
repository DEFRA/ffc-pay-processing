const { getSchemes, schemeDoesNotRequirePPAs } = require('ffc-pay-schemes')
const db = require('./database')
const { addHoldType } = require('./holds')
const { BANK_ACCOUNT_ANOMALY, DAX_REJECTION, AWAITING_DEBT_ENRICHMENT, AWAITING_LEDGER_CHECK } = require('./constants/hold-categories-names')

const updateScheme = async ({ schemeId, schemeName }) => {
  const existingScheme = await db.scheme.findOne({
    where: { schemeId }
  })

  await db.scheme.upsert({
    schemeId,
    name: schemeName,
    active: true
  })

  const created = !existingScheme
  console.log(`${schemeName} ${created ? 'created' : 'updated'}`)
  if (created) {
    // A new scheme also requires the two mandatory D365 related hold categories to be set up.
    await addHoldType(BANK_ACCOUNT_ANOMALY, schemeId)
    await addHoldType(DAX_REJECTION, schemeId)
    console.log('Required D365 holds added')
    // If the scheme supports PPAs, we also need the Request Editor hold categories
    if (!schemeDoesNotRequirePPAs(schemeId)) {
      await db.autoHoldCategory.create({ name: AWAITING_DEBT_ENRICHMENT, schemeId })
      await db.autoHoldCategory.create({ name: AWAITING_LEDGER_CHECK, schemeId })
      console.log('Scheme supports PPAs - required Request Editor holds added')
    }
  }
}

const updateSchemesDatabase = async () => {
  console.log('Checking for updates to supported schemes')
  const schemes = getSchemes()

<<<<<<< Updated upstream
  for (const { schemeId, schemeName } of schemes) {
    const existingScheme = (await db.scheme().where({ schemeId }).first()) ?? null

    await db.scheme().insert({ schemeId, name: schemeName, active: true }).onConflict('schemeId').merge()

    const created = !existingScheme
    console.log(`${schemeName} ${created ? 'created' : 'updated'}`)
    if (created) {
      // A new scheme also requires the two mandatory D365 related hold categories to be set up.
      await Promise.all([
        addHoldType(BANK_ACCOUNT_ANOMALY, schemeId),
        addHoldType(DAX_REJECTION, schemeId)
      ])
      console.log('Required D365 holds added')
      // If the scheme supports PPAs, we also need the Request Editor hold categories
      if (!schemeDoesNotRequirePPAs(schemeId)) {
        await Promise.all([
          db.autoHoldCategory().insert({ name: AWAITING_DEBT_ENRICHMENT, schemeId }),
          db.autoHoldCategory().insert({ name: AWAITING_LEDGER_CHECK, schemeId })
        ])
        console.log('Scheme supports PPAs - required Request Editor holds added')
      }
    }
=======
  for (const scheme of schemes) {
    await updateScheme(scheme) // NOSONAR
>>>>>>> Stashed changes
  }
}

module.exports = {
  updateSchemesDatabase
}
