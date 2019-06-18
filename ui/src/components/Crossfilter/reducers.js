import { Map, Set } from 'immutable'

/**
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
export const sumByGroupReducer = (groupField, valueField) => [
  (prev, d) => {
    return prev.update(
      d.get(groupField),
      0,
      prevCount => prevCount + d.get(valueField)
    )
  },
  (prev, d) => {
    return prev.update(d.get(groupField), 0, total => total - d.get(valueField))
  },
  () => Map(),
]

/**
 * Reducer functions to group unique values from valueField by
 * values of groupField (e.g., "id")
 * @param {String} groupField
 * @param {*} valueField
 */
export const uniqueValuesByGroupReducer = (groupField, valueField) => [
  // add
  (prev, d) => {
    return prev.update(d.get(groupField), Set(), values =>
      values.add(d.get(valueField))
    )
  },
  // remove
  (prev, d) => {
    return prev.update(d.get(groupField), Set(), values =>
      values.remove(d.get(valueField))
    )
  },
  // init
  () => Map(),
]

/**
 * reducer functions to group by unique groupField.  Returns a set of groupFields.
 * call this as `.reduce(...idReducer)` and then unpack the results.
 *
 * For total:
 * `crossfilter.groupAll().reduce(...groupReducer).value().size`
 *
 * By dimension:
 * `dimensions.timestep.group().reduce(...groupReducer).all().map(d => [d.key, d.value.size])`
 */

export const groupReducer = groupField => [
  // add
  (prev, d) => {
    return prev.update(d.get(groupField), 0, prevCount => prevCount + 1)
  },
  // remove
  (prev, d) => {
    return prev.update(d.get(groupField), 0, prevCount =>
      prevCount > 1 ? prevCount - 1 : 0
    )
  },
  // init
  () => Map(),
]
