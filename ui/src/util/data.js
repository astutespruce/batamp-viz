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

/**
 * Round number UP to the nearest power of 10
 * @param {Number} number
 */
export const niceNumber = number => {
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
 * Interpolates the position linearly between min and max
 * @param {Array} range - [min, max]
 * @param {*} position - proportion of distance from min to max
 */
export const interpolate = ([min, max], position) => ((max-min) * position) + min
