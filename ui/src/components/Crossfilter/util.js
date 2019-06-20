import { sum, reduceToObject } from 'util/data'
import { groupReducer, filteredGroupReducer } from './reducers'

/**
 * Calculates the total COUNT (if valueField is absent) or total SUM (if valueField provided)
 * of ALL records.
 * Note: id is a special case, this returns count of unique id
 *
 * @param {Object} crossfilter - Crossfilter object
 * @param {String} valueField - name of the value field within record.
 */
export const getRawTotal = (crossfilter, valueField) => {
  if (!valueField) {
    return crossfilter.size()
  }
  // const values = crossfilter.all().map(d => d.get(valueField))
  const values = crossfilter.all().map(d => d[valueField])
  // id and species are a special case, return count of unique values
  if (valueField === 'id' || valueField === 'species') {
    return new Set(values).size
  }
  return sum(values)
}

/**
 * Calculates the total COUNT (if valueField is absent) or total SUM (if valueField provided)
 * for all records that meet the current filters.
 * Note: id is a special case, this returns count of unique id
 *
 * @param {Object} crossfilter - Crossfilter object
 * @param {String} valueField - name of value field within record.
 */
export const getFilteredTotal = ({ groupAll }, valueField) => {
  if (!valueField) {
    return groupAll().value()
  }
  // id and species are a special case, return count of unique values
  // ONLY where they are nonzero
  if (valueField === 'id' || valueField === 'species') {
    return Object.values(
      groupAll()
        .reduce(...groupReducer(valueField))
        .value()
    ).filter(v => v > 0).length
  }

  return groupAll()
    .reduceSum(d => d[valueField])
    .value()
}

/**
 * Aggregate values within each dimension.
 * If valueField is provided, aggregate will return the SUM, otherwise COUNT.
 * Excludes any dimension for which `internal` property is `true`.
 *
 * @param {Object} dimensions - object containing crossfilter dimensions.
 * @param {String} valueField - name of value field within record.
 *
 */

export const aggregateByDimension = (dimensions, valueField = null) =>
  Object.values(dimensions)
    .filter(({ config: { internal } }) => !internal)
    .map(({ group, config: { field } }) => {
      let sums = null

      switch (valueField) {
        case null: {
          sums = group().all()
          break
        }
        case 'id': {
          sums = group()
            .reduce(...groupReducer(valueField))
            .all()
            // only keep values > 0, and retain count of entries instead of values
            .map(({ key, value }) => ({
              key,
              value: Object.values(value).filter(v => v > 0).length,
            }))
          break
        }
        case 'species': {
          sums = group()
            // only retain entries for species that have nonzero detectionNights
            .reduce(
              ...filteredGroupReducer(valueField, d => d.detectionNights > 0)
            )
            .all()
            // only keep values > 0, and retain count of entries instead of values
            .map(({ key, value }) => ({
              key,
              value: Object.values(value).filter(v => v > 0).length,
            }))
          break
        }
        default: {
          sums = group()
            .reduceSum(d => d[valueField])
            .all()
          break
        }
      }

      // reduce [{key:..., value:...},...] for each entry into {key: value, ...}
      return {
        field,
        total: sums.reduce(...reduceToObject('key', d => d.value)),
      }
    })
    .reduce(...reduceToObject('field', d => d.total))
