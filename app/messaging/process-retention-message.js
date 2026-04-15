const { removeAgreementData } = require('../retention')

const processRetentionMessage = async (message, receiver) => {
  try {
    const retentionData = message.body
    console.log(`Agreement ${retentionData.agreementNumber} for FRN ${retentionData.frn} has passed retention period`)
    await removeAgreementData(retentionData)
    await receiver.completeMessage(message)
    console.log('Data related to agreement removed where present')
  } catch (err) {
    console.error('Unable to process retention data:', err)
    try {
      await receiver.deadLetterMessage(message)
    } catch (deadLetterErr) {
      console.error('Failed to dead letter message:', deadLetterErr)
    }
  }
}

module.exports = {
  processRetentionMessage
}
