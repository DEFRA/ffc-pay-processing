const getTotalValue = (paymentRequests) => {
  return paymentRequests.reduce((x, y) => x + y.value, 0)
}

module.exports = {
  getTotalValue
}
