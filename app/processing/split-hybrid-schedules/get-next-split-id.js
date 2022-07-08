const getNextSplitId = (splitId, increment = 1) => {
  return String.fromCharCode(splitId.charCodeAt(0) + increment)
}

module.exports = getNextSplitId
