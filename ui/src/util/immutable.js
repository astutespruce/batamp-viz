import { List, Map } from 'immutable'

/**
 * Creates an index from an array or ImmutableJS List of objects, using field as the index key.
 * Returns an ImmutableJS map
 *
 * @param {Array or ImmutableJS List} data
 * @param {String} field
 * @param {Boolean} drop - if true, will drop the key from the value for each entry
 */
export const createIndex = (data, field, drop = false) => {
  if (data.size) {
    // data are from a List of Map objects
    return Map(data.map(d => [d.get(field), drop ? d.remove(field) : d]))
  }
  if (drop) {
    return Map(data.map(({ [field]: k, ...rest }) => [k, fromJS(rest)]))
  }
  return Map(data.map(d => [d[field], fromJS(d)]))
}

/**
 * Extract records from the index based on the specified list of keys.
 *
 * @param {Map} index - ImmutableJS map representing the index
 * @param {Set} keys - ImmutableJS Set of keys to filter from the index
 */
export const filterIndex = (index, keys) => {
  return index.filter((v, k) => keys.has(k))
}

/**
 * SUM values within each group.
 * Returns Map where keys are each unique value of groupField.
 * NOTE: if the sum is 0, the key is absent from the resulting Map.
 *
 * @param {Immutable List} records - list of Map objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to sum within each group
 */
export const sumBy = (records, groupField, valueField) =>
  records.reduce(
    (prev, value) =>
      prev.update(
        value.get(groupField),
        0,
        prevCount => prevCount + value.get(valueField, 0)
      ),
    Map()
  )

/**
 * Group an ImmutableJS List into a Map of Lists
 * Returns Map where keys are each unique value of groupField.
 *
 * @param {Immutable List} records - list of Map objects
 * @param {String} groupField - field to group by
 */
export const groupBy = (records, groupField) =>
  records.reduce(
    (prev, value) =>
      prev.update(value.get(groupField), List(), prevList =>
        prevList.push(value)
      ),
    Map()
  )

/**
 * Aggregate unique values of valueField grouped by groupField
 * @param {Immutable List} records - list of Map objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to add to unique list
 */
export const uniqueBy = (records, groupField, valueField) =>
  records.reduce(
    (prev, value) =>
      prev.update(value.get(groupField), Set(), prevList =>
        prevList.add(value.get(valueField))
      ),
    Map()
  )

/**
 * Aggregate COUNT of unique values of valueField grouped by groupField
 * @param {Immutable List} records - list of Map objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to add to unique list
 */
export const countUniqueBy = (records, groupField, valueField) =>
  uniqueBy(records, groupField, valueField).map(v => v.size)

/**
 * For each unique value of groupField, returns an ImmutableJS Map where the key
 * is the value of valueField and the value is 1
 * @param {Immutable List} records - list of Map objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to add to unique list
 */
export const uniqueMapBy = (records, groupField, valueField) =>
  uniqueBy(records, groupField, valueField).map(d => Map(d.map(k => [k, 1])))
