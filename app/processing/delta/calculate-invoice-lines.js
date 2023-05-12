const calculateInvoiceLines = (invoiceLines, apportionmentPercent) => {
  invoiceLines.map(x => {
    x.value = Math.trunc(x.value * apportionmentPercent)
    return x
  })
}

module.exports = {
  calculateInvoiceLines
}
