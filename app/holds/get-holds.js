const db = require('../database')
const schemeIdTbl = schemeIdTbl

const getHolds = async (pageProperties, open = true) => {
  let { pageNumber, pageSize } = pageProperties
  const holdsQuery = db.hold()
    .leftJoin('holdCategories', 'holds.holdCategoryId', 'holdCategories.holdCategoryId')
    .leftJoin('schemes', 'holdCategories.schemeId', schemeIdTbl)
    .select(
      'holds.holdId',
      'holds.frn',
      {
        holdCategoryName: 'holdCategories.name',
        holdCategorySchemeId: schemeIdTbl,
        holdCategorySchemeName: 'schemes.name',
        dateTimeAdded: 'holds.added',
        dateTimeClosed: 'holds.closed'
      }
    )

  const autoHoldsQuery = db.autoHold()
    .leftJoin('autoHoldCategories', 'autoHolds.autoHoldCategoryId', 'autoHoldCategories.autoHoldCategoryId')
    .leftJoin('schemes', 'autoHoldCategories.schemeId', schemeIdTbl)
    .select(
      { holdId: 'autoHolds.autoHoldId' },
      'autoHolds.frn',
      {
        holdCategoryName: 'autoHoldCategories.name',
        holdCategorySchemeId: schemeIdTbl,
        holdCategorySchemeName: 'schemes.name'
      },
      'autoHolds.marketingYear',
      'autoHolds.agreementNumber',
      'autoHolds.contractNumber',
      {
        dateTimeAdded: 'autoHolds.added',
        dateTimeClosed: 'autoHolds.closed'
      }
    )

  if (open) {
    holdsQuery.whereNull('holds.closed')
    autoHoldsQuery.whereNull('autoHolds.closed')
  }

  const holds = await holdsQuery
  const autoHolds = await autoHoldsQuery

  const mergedResults = [...holds, ...autoHolds]

  if (pageNumber && pageSize) {
    pageNumber = Number(pageNumber)
    pageSize = Number(pageSize)
    if (!Number.isNaN(pageNumber) && !Number.isNaN(pageSize)) {
      const offset = (pageNumber - 1) * pageSize
      const paginatedResults = mergedResults.slice(offset, offset + pageSize)
      return paginatedResults
    }
  }

  return mergedResults
}

module.exports = {
  getHolds
}
