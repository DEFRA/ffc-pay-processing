const ensureValueConsistency = (overallDelta, lineDeltas) => {
  // ensure no value gained or lost. if variation between header and lines apply difference to first gross line
  const variation = Math.abs(overallDelta) - Math.abs((lineDeltas.reduce((x, y) => x + y.value, 0)))
  if (variation > 0) {
    const firstGrossLineIndex = lineDeltas[0].findIndex(x => x.description.startsWith('G00'))
    lineDeltas[0][firstGrossLineIndex].value += variation
  }
}

module.exports = ensureValueConsistency
