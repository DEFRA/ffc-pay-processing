const util = require('util')
const { processSettlement, verifySettlement } = require('../settlement')
const { sendProcessingErrorEvent } = require('../event')

const processReturnMessage = async (message, receiver) => {
  try {
    console.log('Return data received:', util.inspect(message.body, false, null, true))

    // const matches = text.match(/F\d{7}C\d{7}V\d{3}/g)

    // if (matches) {
    //     console.log("Found matches:", matches);
    //     console.log("FDMR invoice number detected, exiting.")
    //     return;
    // }
    const settlementVerified = verifySettlement(message.body)

    if (!settlementVerified) {
      console.warn('Settlement is un-verified, and will not be processed for payment request', message.body)
      return
    }

    const settlementCompleted = await processSettlement(message.body)

    if (settlementCompleted) {
      await receiver.completeMessage(message)
      console.log('Settlement statuses updated from return file')
    } else {
      await receiver.deadLetterMessage(message)
      console.error('Settlement could not be processed for payment request', message.body)
    }
  } catch (err) {
    console.error('Unable to process return request:', err)
    await sendProcessingErrorEvent(message.body, err)
  }
}

module.exports = {
  processReturnMessage
}
