const { getClosureCount } = require('./get-closure-count')
const { getClosures } = require('./get-closures')
const { addClosure } = require('./add-closure')
const { addBulkClosure } = require('./add-bulk-closure')
const { removeClosureByFRNAndAgreement } = require('./remove-closure-by-frn-and-agreement')

module.exports = {
  getClosureCount,
  addClosure,
  addBulkClosure,
  getClosures,
  removeClosureByFRNAndAgreement
}
