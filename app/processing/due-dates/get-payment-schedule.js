const moment = require('moment')
const { getSchedule } = require('./get-schedule')
const { Q4, Q3, M12, T4, Y1, Y2, T2 } = require('../../constants/schedules')
const { MONTH, DAY } = require('../../constants/time-periods')
const { DATE_FORMAT } = require('../../constants/date-formats')

const getPaymentSchedule = (schedule, dueDate, settledValue, totalValue, currentDate) => {
  const scheduleDate = moment(dueDate, DATE_FORMAT)

  switch (schedule) {
    case Q4:
      return getSchedule(scheduleDate, 4, settledValue, totalValue, 3, MONTH, currentDate)
    case Q3:
      return getSchedule(scheduleDate, 3, settledValue, totalValue, 3, MONTH, currentDate)
    case M12:
      return getSchedule(scheduleDate, 12, settledValue, totalValue, 1, MONTH, currentDate)
    case T4:
      return getSchedule(scheduleDate, 4, settledValue, totalValue, 3, DAY, currentDate)
    case Y1:
      return getSchedule(scheduleDate, 1, settledValue, totalValue, 0, DAY, currentDate)
    case Y2:
      // Y2 schedule to be one payment on 01/08, second 30/09.
      return getSchedule(scheduleDate, 2, settledValue, totalValue, 60, DAY, currentDate)
    case T2:
      return getSchedule(scheduleDate, 2, settledValue, totalValue, 3, DAY, currentDate)
    default:
      throw new Error(`Unknown schedule ${schedule}`)
  }
}

module.exports = {
  getPaymentSchedule
}
