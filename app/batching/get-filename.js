const moment = require('moment')

const getFileName = (batch) => {
  return `${batch.scheme.batchProperties.prefix}${batch.sequence.padStart(4, '0')}_${batch.ledger}_${moment(batch.started).format('YYYYMMDDHHmmss')}${batch.scheme.batchProperties.suffix}.csv`
}

module.exports = getFileName
