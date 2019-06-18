import { Map, List, Set, fromJS } from 'immutable'

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

/** Unpack the packed detector time series data
 *
 * @param {Array} - array of data from extractNodes of graphql data for detector time series
 */
export const unpackTSData = data => {
  return fromJS(
    data.map(({ id, speciesId, timestamp, value }) => {
      // timstamp is MYY, divide by 100 and extract whole number to get month
      const month = Math.trunc(timestamp / 100)

      // value is detectorNights|detectionNights|detections if detectionNights or detections are > 0, else
      // it is just detectorNights
      let detectionNights = 0
      let detections = 0
      let detectorNights = 0
      if (value.includes('|')) {
        ;[detectorNights, detectionNights, detections] = value
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
  )
}

/**
 * Merge location data from detector data into timeseries data
 *
 * @param {ImmutableJS List} timeseries - list of detector timeseries data
 * @param {ImmutableJS Map} detectorIndex - map of detector data by detectorID
 */
export const mergeLocationIntoTS = (timeseries, detectorIndex) => {
  return timeseries.map(d => {
    const detector = detectorIndex.get(d.get('id'))
    return d.merge({
      lat: detector.get('lat'),
      lon: detector.get('lon'),
      admin1Name: detector.get('admin1Name'),
    })
  })
}

/**
 * Extract graphql detectorJson data to ImmutableJS list.
 * Update height to correct value.
 *
 * @param {Array} detectorsJson - array of graphql edges
 */
export const extractDetectors = detectorsJson => {
  return fromJS(
    extractNodes(detectorsJson).map(d => ({
      // note: detector height is multiplied by 10 to make into integer,
      // reverse that here
      ...d,
      micHt: d.micHt / 10,
    }))
  )
}
