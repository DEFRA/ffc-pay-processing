const { processSettlement } = require('../settlement')
const { sendProcessingErrorEvent } = require('../event')

const processReturnMessage = async (message, receiver) => {
  try {
    console.log('Return data received:', { frn: message.body.frn, sbi: message.body.sbi, invoiceNumber: message.body.invoiceNumber })

    const settlementCompleted = await processSettlement(message.body)

    if (settlementCompleted) {
      await receiver.completeMessage(message)
      console.log('Settlement statuses updated from return file')
    } else {
      await receiver.deadLetterMessage(message)
      console.error('Settlement could not be processed for payment request', { frn: message.body.frn, sbi: message.body.sbi, invoiceNumber: message.body.invoiceNumber })
    }
  } catch (err) {
    console.error('Unable to process return request:', err)
    await sendProcessingErrorEvent(message.body, err)
  }
}

module.exports = {
  processReturnMessage
}
