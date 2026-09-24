const { getSchemeIds, getSchemeNames } = require('ffc-pay-schemes')

const { SFI } = getSchemeIds()
const { SFI: SFI_NAME } = getSchemeNames()

module.exports = {
  schemeId: SFI,
  name: SFI_NAME,
  active: true
}
