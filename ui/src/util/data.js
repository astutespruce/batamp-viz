import { extractNodes } from './graphql'
import { SPECIES_ID } from '../../config/constants'

/**
 * Generates an monotonically increasing array from start to stop.
 *
 * @param {Number} start - starting index
 * @param {Number} stop - final index
 */
export const range = (start, stop) =>
  Array.from({ length: stop }, (v, i) => i + start)

/**
 * Sum values in array.
 * @param {Array} values
 */
export const sum = values => values.reduce((prev, value) => prev + value, 0)

/**
 * Creates a reducer function to pass on to a .reduce() operation.
 * If valueGetter is present, it will be executed on each object
 * in the array this is being called against (except key field).  Otherwise,
 * it returns a new object with just the remaining non-key fields and values.
 *
 * @param {name of field to set as key} keyField
 * @param {*} valueGetter - OPTIONAL: function to extract value from remaining
 * (non-key) values in each object in array
 */
export const reduceToObject = (keyField, valueGetter) => [
  (prev, { [keyField]: key, ...rest }) =>
    Object.assign(prev, { [key]: valueGetter ? valueGetter(rest) : rest }),
  {},
]

/**
 * Convert an array of objects into a single object with key / value.
 * Note: key is not available to valueGetter
 * Example:
 * objectsToObjects([{key: 1, value: 'a'}, ...], 'key', d => d.value)
 *
 * @param {Array} values - array of objects to merge into object
 * @param {name of field to set as key} keyField
 * @param {*} valueGetter - OPTIONAL: function to extract value from remaining
 * (non-key) values in each object in array
 */
export const objectsToObject = (values, keyField, valueGetter) =>
  values.reduce(...reduceToObject(keyField, valueGetter))

/**
 * Filter an object to only those entries that meet the predicate function.
 * Returns a new object.
 *
 * From: https://stackoverflow.com/a/37616104
 * @param {Object} obj
 * @param {function} predicate - function that determines if entry should be kept
 */
export const filterObject = (obj, predicate) => {
  const selected = Object.keys(obj)
    .filter(key => predicate(obj[key]))
    .map(key => ({ [key]: obj[key] }))

  return selected.length > 0 ? Object.assign(...selected) : {}
}

/**
 * Round number to the nearest power of 10
 * @param {Number} number
 */
export const niceNumber = number => {
  if (number >= 1 && number < 10) {
    return number
  }
  const factor = 10 ** Math.max(number.toString().length - 2, 1)
  return Math.round(number / factor) * factor
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
 * NOTE: if the sum is 0, the key is absent from the resulting Map.
 *
 * @param {Array} records - Array of objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to sum within each group
 */
export const sumBy = (records, groupField, valueField) =>
  records.reduce((prev, record) => {
    const group = record[groupField]
    prev[group] = (prev[group] || 0) + (record[valueField] || 0)
    return prev
  }, {})

/**
 * Aggregate unique values of valueField grouped by groupField
 * Returns a JS Set for each value of groupField
 * @param {Array} records - Array of objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to add to unique list
 */
export const uniqueBy = (records, groupField, valueField) =>
  records.reduce((prev, record) => {
    const group = record[groupField]
    const prevValues = prev[group] || new Set()
    prevValues.add(record[valueField])
    prev[group] = prevValues
    return prev
  }, {})

/**
 * Aggregate COUNT of unique values of valueField grouped by groupField
 * @param {Array} records - Array of objects
 * @param {String} groupField - field to group by
 * @param {String} valueField - field to add to unique list
 */
export const countUniqueBy = (records, groupField, valueField) =>
  Object.entries(uniqueBy(records, groupField, valueField)).reduce(
    (prev, [k, v]) => {
      prev[k] = v.size
      return prev
    },
    {}
  )

export const mapValues = (records, func) =>
  Object.entries(records).reduce((prev, [k, v]) => {
    prev[k] = func(v)
    return prev
  }, {})

/**
 * Groups array into an object, keyed by value of `field`.
 * Returns an object
 *
 * @param {Array } data
 * @param {String} groupField - name of group field to group by
 */
export const groupBy = (data, groupField) => {
  return data.reduce((prev, d) => {
    const key = d[groupField]
    prev[key] = (prev[key] || []).concat([d])
    return prev
  }, {})
}

/**
 * Extract graphql detectorJson data to Array of objects.
 * Update height to correct value.
 *
 * @param {Array} detectorsJson - array of graphql edges
 */
export const extractDetectors = detectorsJson =>
  extractNodes(detectorsJson).map(d => ({
    // note: detector height is multiplied by 10 to make into integer,
    // reverse that here
    ...d,
    micHt: d.micHt / 10,
  }))

/** Unpack the packed detector time series data
 *
 * @param {Array} - array of data from extractNodes of graphql data for detector time series
 */
export const unpackTSData = data =>
  data.map(({ id, speciesId, timestamp, value }) => {
    // timstamp is MYY, divide by 100 and extract whole number to get month
    const month = Math.trunc(timestamp / 100)

    // value is detectorNights|detectionNights|detections if detectionNights or detections are > 0, else
    // it is just detectorNights
    let detectionNights = 0
    let detections = 0
    let detectorNights = 0
    if (value.includes('|')) {
      [detectorNights, detectionNights, detections] = value
        .split('|')
        .map(d => parseInt(d, 10))
    } else {
      detectorNights = parseInt(value, 10)
    }

    return {
      id,
      species: SPECIES_ID[speciesId],
      month,
      year: timestamp - 100 * month + 2000,
      detectorNights,
      detectionNights,
      detections,
    }
  })

/**
 * Joins right to left, if values are available for left.
 * Join is a left join, values are only copied from right a match is found.
 * Will join all fields from left and from right
 *
 * @param {Array} left - data being joined in
 * @param {Array} right - data being joined to left
 * @param {*} on - name of field to join on
 */
export const join = (left, right, on) => {
  if (!on) {
    throw new Error('`on` must be provided for join')
  }
  const rightIndex = groupBy(right, on)
  return left.map(record => {
    const joined = rightIndex[record[on]]

    if (!(joined && joined.length)) {
      return record
    }

    return {
      ...record,
      ...joined[0],
    }
  })
}

/**
 * Compute the difference between setA and setB (the items in B not in A)
 * @param {Set} setA
 * @param {Set} setB
 */
export const difference = (setA, setB) => {
  const result = new Set(setA)
  setB.forEach(d => result.delete(d))
  return result
}

/**
 * Compute the symmetric difference between setA and setB
 * @param {Set} setA
 * @param {Set} setB
 */
export const symmetricDifference = (setA, setB) => {
  const result = new Set(setA)
  setB.forEach(d => {
    if (result.has(d)) {
      result.delete(d)
    } else {
      result.add(d)
    }
    result.delete(d)
  })
  return result
}

/**
 * Deep clone the object.  Object must be JSON compatible.
 * @param {Object} obj
 */
export const clone = obj => {
  return JSON.parse(JSON.stringify(obj))
}
