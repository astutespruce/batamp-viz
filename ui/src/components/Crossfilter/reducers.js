/**
 * reducer functions to group by unique groupField.
 * Returns the count for each groupField.
 * call this as `.reduce(...idReducer)` and then filter the results to
 * remove any entries with a count of 0.
 */

export const groupReducer = groupField => [
  // add
  (prev, record) => {
    // only count it if valueField is nonzero
    // if (!record[valueField]) {
    //   return prev
    // }
    const group = record[groupField]
    prev[group] = (prev[group] || 0) + 1
    return prev
  },
  // remove
  (prev, record) => {
    const group = record[groupField]

    // never let counts go below 0
    prev[group] = Math.max((prev[group] || 0) - 1, 0)
    return prev
  },
  // init
  () => ({}),
]

export const filteredGroupReducer = (groupField, filterFunc) => [
  // add
  (prev, record) => {
    // ignore if it fails the filterFunc
    if (!filterFunc(record)) {
      return prev
    }
    const group = record[groupField]
    prev[group] = (prev[group] || 0) + 1
    return prev
  },
  // remove
  (prev, record) => {
    // ignore if it fails the filterFunc
    if (!filterFunc(record)) {
      return prev
    }

    const group = record[groupField]

    // never let counts go below 0
    prev[group] = Math.max((prev[group] || 0) - 1, 0)
    return prev
  },
  // init
  () => ({}),
]
