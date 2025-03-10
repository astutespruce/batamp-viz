export const formatNumber = (number, decimals = null) => {
  const absNumber = Math.abs(number)
  let targetDecimals = decimals
  if (targetDecimals === null) {
    // guess number of decimals based on magnitude
    if (absNumber > 10 || Math.round(absNumber) === absNumber) {
      targetDecimals = 0
    } else if (absNumber > 1) {
      targetDecimals = 1
    } else {
      targetDecimals = 2
    }
  }
  // override targetDecimals for (effectively) integer values
  if (
    Math.round(absNumber) === absNumber ||
    Math.round(number * 10 ** targetDecimals) / 10 ** targetDecimals ===
      Math.round(number)
  ) {
    targetDecimals = 0
  }

  const factor = 10 ** targetDecimals

  // format to localeString, and manually set the desired number of decimal places
  return (Math.round(number * factor) / factor).toLocaleString(undefined, {
    minimumFractionDigits: targetDecimals,
    maximumFractionDigits: targetDecimals,
  })
}

/**
 * Return a singular label (remove trailing 's') if quantity === 1
 * @param {*} label - plural label
 * @param {*} quantity
 */
export const quantityLabel = (label, quantity) => {
  if (quantity === 1 && !label.endsWith('species') && label.endsWith('s')) {
    return label.slice(0, label.length - 1)
  }
  return label
}
