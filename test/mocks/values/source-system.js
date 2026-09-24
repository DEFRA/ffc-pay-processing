const { getSourceSystems } = require('ffc-pay-schemes')

const { SFI } = getSourceSystems()

module.exports = {
  SOURCE_SYSTEM: SFI
}
