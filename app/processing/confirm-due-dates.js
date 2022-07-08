const { AP } = require('../ledgers')
const moment = require('moment')
const { QUARTERLY, MONTHLY, THREE_DAY_QUARTERLY } = require('../schedules')

const confirmDueDates = (paymentRequests, previousPaymentRequests, currentDate = new Date()) => {
  // to avoid balloon reduction, any recoveries routed to AP must get a new schedule and due date covering only remaining payments
  // and not include schedules in the past
  const firstPaymentRequest = previousPaymentRequests?.find(x => x.paymentRequestNumber === 1)
  // if payment is not split across schedule no action needed
  if (!firstPaymentRequest?.schedule) {
    return paymentRequests
  }

  const settledValue = getSettledValue(previousPaymentRequests)
  const totalValue = getTotalValue(previousPaymentRequests)
  const paymentSchedule = getPaymentSchedule(firstPaymentRequest.schedule, firstPaymentRequest.dueDate, settledValue, totalValue, currentDate)
  const outstandingSchedule = paymentSchedule.filter(x => x.outstanding)

  // if no payments left in schedule then no action needed
  if (!outstandingSchedule.length) {
    return paymentRequests
  }

  paymentRequests
    .filter(x => x.ledger === AP && x.value < 0)
    .map(paymentRequest => {
      paymentRequest.schedule = `${firstPaymentRequest.schedule.charAt(0)}${outstandingSchedule.length}`
      paymentRequest.dueDate = outstandingSchedule[0].dueDate
      return paymentRequest
    })

  return paymentRequests
}

const getTotalValue = (previousPaymentRequests) => {
  return previousPaymentRequests.filter(x => x.ledger === AP).reduce((x, y) => x + (y.value ?? 0), 0)
}

const getSettledValue = (previousPaymentRequests) => {
  return previousPaymentRequests.filter(x => x.ledger === AP).reduce((x, y) => x + (y.settledValue ?? 0), 0)
}

const getPaymentSchedule = (schedule, dueDate, settledValue, totalValue, currentDate) => {
  const scheduleDate = moment(dueDate, 'DD/MM/YYYY')

  switch (schedule) {
    case QUARTERLY:
      return getSchedule(scheduleDate, 4, settledValue, totalValue, 3, 'month', currentDate)
    case MONTHLY:
      return getSchedule(scheduleDate, 12, settledValue, totalValue, 1, 'month', currentDate)
    case THREE_DAY_QUARTERLY:
      return getSchedule(scheduleDate, 4, settledValue, totalValue, 3, 'day', currentDate)
    default:
      throw new Error(`Unknown schedule ${schedule}`)
  }
}

const getExpectedValue = (totalValue, totalPayments, segment) => {
  return Math.trunc(totalValue / totalPayments * segment)
}

const getSchedule = (scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate) => {
  const scheduleDates = []
  let expectedSettlementValue = 0
  for (let i = 1; i <= totalPayments; i++) {
    expectedSettlementValue = getExpectedValue(totalValue, totalPayments, i)
    const cappedSettlementValue = settledValue <= expectedSettlementValue ? settledValue : expectedSettlementValue
    scheduleDates.push({
      dueDate: scheduleDate.format('DD/MM/YYYY'),
      outstanding: scheduleDate >= currentDate || cappedSettlementValue < expectedSettlementValue
    })
    scheduleDate = scheduleDate.add(increment, unit)
  }
  return scheduleDates
}

module.exports = confirmDueDates
