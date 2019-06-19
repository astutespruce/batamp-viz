import { Map, Set } from 'immutable'

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

/** NOT USED
 * Create a triad of add, remove, init reducers to use with the
 * `.groupAll().reduce(...<thisResult>)` function on a dimension,
 * which returns the SUM of values by groupField.
 * The result of using this is an ImmutableJS Map Object where
 * the key is the id value of each record, and the value is the non-zero
 * total of all values of valueField for those records that meet all
 * OTHER filters than the current dimension.
 *
 * IMPORTANT: since this is applied to a dimension, the filters against
 * that dimension ARE NOT USED.
 * Also note: this DOES NOT work where valueField === groupField
 *
 * @param {String} valueField - name of value field
 */
// export const sumByGroupReducer = (groupField, valueField) => [
//   (prev, d) => {
//     return prev.update(
//       d[groupField], // d.get(groupField),
//       0,
//       prevCount => prevCount + d[valueField] // d.get(valueField)
//     )
//   },
//   (prev, d) => {
//     // return prev.update(d.get(groupField), 0, total => total - d.get(valueField))
//     return prev.update(d[groupField], 0, total => total - d[valueField])
//   },
//   () => Map(),
// ]

/** NOT USED
 * Reducer functions to group unique values from valueField by
 * values of groupField (e.g., "id")
 * @param {String} groupField
 * @param {*} valueField
 */
// export const uniqueValuesByGroupReducer = (groupField, valueField) => [
//   // add
//   (prev, d) => {
//     // return prev.update(d.get(groupField), Set(), values =>
//     //   values.add(d.get(valueField))
//     // )
//     return prev.update(d[groupField], Set(), values =>
//       values.add(d[valueField])
//     )
//   },
//   // remove
//   (prev, d) => {
//     // return prev.update(d.get(groupField), Set(), values =>
//     //   values.remove(d.get(valueField))
//     // )
//     return prev.update(d[groupField], Set(), values =>
//       values.remove(d[valueField])
//     )
//   },
//   // init
//   () => Map(),
// ]
