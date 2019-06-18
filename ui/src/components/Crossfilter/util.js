import { Map, Set } from 'immutable'

import { sum } from 'util/data'
import {
  groupReducer,
  uniqueValuesByGroupReducer,
  sumByGroupReducer,
} from './reducers'

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
  const values = crossfilter.all().map(d => d.get(valueField))
  // id and species are a special case, return count of unique values
  if (valueField === 'id' || valueField === 'species') {
    return Set(values).size
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
  if (valueField === 'id' || valueField === 'species') {
    return groupAll()
      .reduce(...groupReducer(valueField))
      .value().size
  }

  return groupAll()
    .reduceSum(d => d.get(valueField))
    .value()
}

/**
 * COUNT(valueField) by dimension.
 * Excludes any dimension for which `aggregate` property is `false`.
 * Note: records in crossfilter are ImmutableJS Map objects.
 *
 * @param {Object} dimensions - object containing crossfilter dimensions.
 *
 */
export const countByDimension = dimensions => {
  return Map(
    Object.values(dimensions)
      .filter(({ config: { aggregate = true } }) => aggregate)
      .map(({ group, config: { field } }) => {
        // Convert the array of key:count returned by crossfilter to a Map
        const counts = Map(
          group()
            .all()
            .map(d => Object.values(d))
        )
        return [field, counts]
      })
  )
}

/**
 * SUM(valueField) by dimension
 * Excludes any dimension for which `aggregate` property is `false`.
 * Note: records in crossfilter are ImmutableJS Map objects.
 *
 * @param {Object} dimensions - object containing crossfilter dimensions.
 * @param {String} valueField - name of value field within record.
 *
 */
export const sumByDimension = (dimensions, valueField) => {
  return Map(
    Object.values(dimensions)
      .filter(({ config: { aggregate = true } }) => aggregate)
      .map(({ group, config: { field } }) => {
        const sums = Map(
          group()
            .reduceSum(d => d.get(valueField))
            .all()
            .map(d => Object.values(d))
        )
        return [field, sums]
      })
  )
}

/**
 * Aggregate values within each dimension.
 * If valueField is provided, aggregate will return the SUM, otherwise COUNT.
 * Excludes any dimension for which `internal` property is `true`.
 * Note: records in crossfilter are ImmutableJS Map objects.
 *
 * @param {Object} dimensions - object containing crossfilter dimensions.
 * @param {String} valueField - name of value field within record.
 *
 */
export const aggregateByDimension = (dimensions, valueField) => {
  // id and species are a special case, return count of unique values
  const isGrouped = valueField === 'id' || valueField === 'species'
  const reducer = isGrouped ? groupReducer(valueField) : null

  return Map(
    Object.values(dimensions)
      // .filter(({ config: { aggregate = true } }) => aggregate)
      .filter(({ config: { internal } }) => !internal)
      .map(({ group, config: { field } }) => {
        let sums = null

        if (!valueField) {
          sums = group()
            .all()
            .map(d => Object.values(d))
        } else if (isGrouped) {
          sums = group()
            .reduce(...reducer)
            .all()
            .map(d => [d.key, d.value.size])
        } else {
          sums = group()
            .reduceSum(d => d.get(valueField))
            .all()
            .map(d => Object.values(d))
        }
        return [field, Map(sums)]
      })
  )
}

/**
 * Aggregate values by id field within each dimension.
 * Aggregate will return the SUM by valueField.
 * Excludes any dimension for which `aggregateById` property is `false`.
 * Note: records in crossfilter are ImmutableJS Map objects.
 *
 * @param {Object} dimensions - object containing crossfilter dimensions.
 * @param {String} valueField - name of value field within record.
 *
 */
export const aggregateDimensionById = (dimensions, valueField) => {
  // TODO: generalize
  const reducerFunc =
    valueField === 'species' ? uniqueValuesByGroupReducer : sumByGroupReducer
  const reducer = reducerFunc('id', valueField)

  const aggregate = groupAll => {
    const total = groupAll()
      .reduce(...reducer)
      .value()
    if (valueField === 'species') {
      return total.map(d => d.size)
    }
    return total
  }

  return Map(
    Object.values(dimensions)
      .filter(({ config: { aggregateById } }) => aggregateById)
      .map(({ groupAll, config: { field } }) => {
        return [field, aggregate(groupAll)]
      })
  )
}
