const raiseEvent = require('./raise-event')
const { v4: uuidv4 } = require('uuid')

const sendProcessingAckInvalidBankDetailsErrorEvent = async (frn) => {
  const event = {
    id: uuidv4(),
    name: 'invalid-bank-details',
    type: 'error',
    message: 'No valid bank details held',
    data: { frn }
  }
  await raiseEvent(event)
}

module.exports = sendProcessingAckInvalidBankDetailsErrorEvent
