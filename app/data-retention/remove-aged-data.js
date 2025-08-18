const { clearAllAgedData } = require('./clear-all-aged-data')
const { getAgedAgreements } = require('./get-aged-agreements')
const { getSchemeName } = require('./get-scheme-name')

const removeAgedData = async () => {
  const agedAgreements = await getAgedAgreements()
  for (const agreement of agedAgreements) {
    try {
      const { name } = await getSchemeName(agreement.schemeId)
      await clearAllAgedData(agreement)
      console.log(`Removed data related to scheme ${name} for aged agreement ${agreement.agreementNumber}`)
    } catch (error) {
      console.error(`Failed to remove data for aged agreement ${agreement.agreementNumber}`, error)
    }
  }
}

module.exports = {
  removeAgedData
}
