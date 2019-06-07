import { Map, List, fromJS } from 'immutable'

/**
 * Generates an monotonically increasing array from start to stop.
 *
 * @param {Number} start - starting index
 * @param {Number} stop - final index
 */
export const range = (start, stop) =>
  Array.from({ length: stop }, (v, i) => i + start)

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

export const sum = values => values.reduce((prev, value) => prev + value, 0)

/**
 * Round number UP to the nearest power of 10
 * @param {Number} number
 */
export const niceNumber = number => {
  if (number > 1 && number < 10) {
    return number
  }
  const factor = 10 ** Math.max(number.toString().length - 2, 1)
  return Math.ceil(number / factor) * factor
}

/**
 * Interleaves a and b arrays into a single flat array:
 * a=[1,2], b=[3,4]
 * returns [1,3,2,4]
 *
 * @param {Array} a
 * @param {Array} b
 */
export const flatzip = (a, b) => {
  if (a.length !== b.length) {
    throw new Error('arrays must be equal to use zip')
  }

  return a.reduce((prev, v, i) => prev.concat([v, b[i]]), [])
}

/**
 * SUM values within each group.
 * Returns Map where keys are each unique value of groupField.
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
        prevCount => prevCount + value.get(valueField)
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

