import { Map, fromJS } from 'immutable'

/**
 * Generates an monotonically increasing array from start to stop.
 *
 * @param {Number} start - starting index
 * @param {Number} stop - final index
 */
export const range = (start, stop) =>
  Array.from({ length: stop }, (v, i) => i + start)

/**
 * Creates an index from an array of objects, using field as the index key.
 * Returns an ImmutableJS map
 *
 * @param {Array} data
 * @param {String} field
 */
export const createIndex = (data, field) => {
  // const temp = {}
  // data.forEach(d => {
  //   temp[d[field]] = d
  // })

  // return fromJS(temp)
  return Map(data.map(({ [field]: k, ...rest }) => [k, fromJS(rest)]))
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
