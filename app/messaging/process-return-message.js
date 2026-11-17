const { processSettlement, checkInvoiceNumberBlocked } = require('../settlement')
const { sendProcessingErrorEvent } = require('../event')

const processReturnMessage = async (message, receiver) => {
  try {
    console.log('Return data received:', {
      frn: message.body.frn,
      ...(message.body.sbi != null && { sbi: message.body.sbi }),
      invoiceNumber: message.body.invoiceNumber
    })

    const isBlocked = checkInvoiceNumberBlocked(message.body.invoiceNumber)

    if (isBlocked) {
      console.log(`Settlement with invoice number: ${message.body.invoiceNumber} is blocked, and will not be processed for payment request`)
      await receiver.completeMessage(message)
      return
    }

    const settlementCompleted = await processSettlement(message.body)

    if (settlementCompleted) {
      await receiver.completeMessage(message)
      console.log('Settlement statuses updated from return file')
    } else {
      await receiver.deadLetterMessage(message)
      console.error('Settlement could not be processed for payment request', {
        frn: message.body.frn,
        ...(message.body.sbi != null && { sbi: message.body.sbi }),
        invoiceNumber: message.body.invoiceNumber
      })
    }
  } catch (err) {
    console.error('Unable to process return request:', err)
    await sendProcessingErrorEvent(message.body, err)
  }
}

module.exports = {
  processReturnMessage
}
