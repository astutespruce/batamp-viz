import { Map, Set } from 'immutable'

/**
 * reducer functions to group by unique ID.  Returns a set of IDS.
 * call this as `.reduce(...idReducer)` and then unpack the results.
 *
 * For total:
 * `crossfilter.groupAll().reduce(...idReducer).value().size`
 *
 * By dimension:
 * `dimensions.timestep.group().reduce(...idReducer).all().map(d => [d.key, d.value.size])`
 */
const idReducer = [
  // add
  (prev, d) => prev.add(d.get('id')),
  // remove
  (prev, d) => prev.remove(d.get('id')),
  // init
  () => Set(),
]

window.idReducer = idReducer

export const countFiltered = cf =>
  cf
    .groupAll()
    .reduceCount()
    .value()

/**
 * Calculates the total COUNT (if valueField is absent) or total SUM (if valueField provided)
 * for all records that meet the current filters.
 *
 * @param {Object} crossfilter - Crossfilter object
 * @param {String} valueField - name of value field within record.
 */
export const aggregateTotal = ({ groupAll }, valueField) => {
  if (!valueField) {
    return groupAll().value()
  }
  // id is a special case, return count of unique IDs
  if (valueField === 'id') {
    return groupAll()
      .reduce(...idReducer)
      .value().size
  }
  return groupAll()
    .reduceSum(d => d.get(valueField))
    .value()
}

// COUNT records by dimension value for each dimension
export const countByDimension = dimensions => {
  return Map(
    Object.values(dimensions).map(({ group, config: { field } }) => {
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

// SUM(valueField) by dimension value in each dimension
export const sumByDimension = (dimensions, valueField) => {
  return Map(
    Object.values(dimensions).map(({ group, config: { field } }) => {
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
 * Aggregate values within each dimension.  Note: records in crossfilter are ImmutableJS Map objects.
 * If valueField is provided, aggregate will return the SUM, otherwise COUNT.
 * Exludes any dimension for which `aggregate` property is `false`.
 *
 * @param {Object} dimensions - object containing crossfilter dimensions.
 * @param {String} valueField - name of value field within record.
 *
 */
export const aggregateByDimension = (dimensions, valueField) => {
  return Map(
    Object.values(dimensions)
      .filter(({ config: { aggregate = true } }) => aggregate)
      .map(({ group, config: { field } }) => {
        let sums = null

        if (!valueField) {
          sums = group()
            .all()
            .map(d => Object.values(d))
        } else if (valueField === 'id') {
          sums = group()
            .reduce(...idReducer)
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
