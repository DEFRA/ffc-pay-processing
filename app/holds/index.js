const { getHoldCategoryId } = require('./get-hold-category-id')
const { getHolds } = require('./get-holds')
const { getHoldCategories } = require('./get-hold-categories')
const { getSchemeId } = require('./get-scheme-id')
const { addHold } = require('./add-hold')
const { addBulkHold } = require('./add-bulk-hold')
const { removeBulkHold } = require('./remove-bulk-hold')
const { removeHoldById } = require('./remove-hold-by-id')
const { removeHoldByFrn } = require('./remove-hold-by-frn')
const { addHoldType } = require('./add-hold-type')
const { editHoldType } = require('./edit-hold-type')
const { removeHoldType } = require('./remove-hold-type')

module.exports = {
  getHoldCategoryId,
  getHolds,
  getHoldCategories,
  getSchemeId,
  addHold,
  addHoldType,
  addBulkHold,
  editHoldType,
  removeBulkHold,
  removeHoldById,
  removeHoldByFrn,
  removeHoldType
}
