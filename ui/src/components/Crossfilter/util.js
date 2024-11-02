import { addFunction, op, escape } from 'arquero'

import { H3_COLS } from 'config'
import { sum, reduceToObject } from 'util/data'
import { groupReducer, filteredGroupReducer } from './reducers'

/**
 * Determine if record values contain any of the filterValues
 * @param {Array} filterValues - values in filter that are being searched
 * @param {Array} values - values on record
 * @returns bool
 */
const hasAny = (filterValues, values) => {
  for (let i = 0; i < filterValues.length; i += 1) {
    if (op.indexof(values, filterValues[i]) !== -1) {
      return true
    }
  }
  return false
}

// define hasAny filter for use in arquero
// NOTE: overwrite is used to redefine this on window reload
addFunction('hasAny', hasAny, { override: true })

/**
 * Create object with dimensions
 * @param {Array} filters - array of filter objects
 * @returns Object
 */
export const createDimensions = (filters) => {
  // FIXME:
  window.op = op
  window.escape = escape
  window.reduceToObject = reduceToObject

  const dimensions = {}
  filters.forEach((filter) => {
    dimensions[filter.field] = filter
    if (filter.isArray) {
      throw new Error('isArray not yet supported')
    }
  })

  return dimensions
}

/**
 * Apply aggFuncs to each group
 * TODO: this does not handle isArray type dimensions!
 * @param {Object} table - arquero table
 * @param {String} groupByField - field to group table by
 * @param {Function} aggFunc - aggregation function passed to rolloup to calculate total
 * @returns Number
 */
export const aggregateByGroup = (table, groupByField, aggFuncs) => {
  const outFields = Object.keys(aggFuncs)
  return Object.fromEntries(
    table
      .groupby(groupByField)
      .rollup(aggFuncs)
      .derive({ row: op.row_object(...outFields) })
      .derive({
        entries: escape((d) => [d[groupByField], d.row]),
      })
      .array('entries')
  )
}

/**
 * Aggregate each dimension according to aggFuncs
 * @param {Object} table - arquero table
 * @param {Object} dimensions - object of dimension objects by ID
 * @param {Function} aggFuncs - object of aggregation functions passed to table rollup
 */
export const aggregateByDimension = (table, dimensions, aggFuncs) =>
  Object.fromEntries(
    Object.values(dimensions).map(({ field }) => [
      field,
      aggregateByGroup(table, field, aggFuncs),
    ])
  )

/**
 * Aggregate each dimension according to aggFuncs
 * @param {Object} table - arquero table
 * @param {Object} dimensions - object of dimension objects by ID
 * @param {Function} aggFuncs - object of aggregation functions passed to table rollup
 */
// export const aggregateByH3 = (table, aggFuncs) =>
//   Object.fromEntries(
//     H3_COLS.map((col) => [col, aggregateByGroup(table, col, aggFuncs)])
//   )

/**
 * Calculate list of unique values for field within table
 * @param {Object} table - arquero table
 * @param {String} field - field name
 * @returns Array
 */
export const getDistinctValues = (table, field) =>
  table.rollup({ values: op.array_agg_distinct(field) }).array('values')[0]

/**
 * Extract valueField from stats objects based on full set of ids present in
 * h3Ids and siteIds, backfilled with 0 where the location is not in the stats
 */
export const getTotals = ({
  topLevelStats,
  dimensionStats,
  h3Stats,
  siteStats,
  h3Ids,
  siteIds,
  valueField,
}) => ({
  total: topLevelStats[valueField] || 0,
  dimensionTotals: Object.fromEntries(
    Object.entries(dimensionStats).map(([dimensionKey, dimensionValues]) => [
      dimensionKey,
      Object.fromEntries(
        Object.entries(dimensionValues).map(
          ([dimensionValue, { [valueField]: metricTotal }]) => [
            dimensionValue,
            metricTotal,
          ]
        )
      ),
    ])
  ),
  h3Totals: Object.fromEntries(
    H3_COLS.map((col) => [
      col,
      Object.fromEntries(
        h3Ids[col].map((id) => [
          id,
          h3Stats[col][id] ? h3Stats[col][id][valueField] : 0,
        ])
      ),
    ])
  ),
  siteTotals: Object.fromEntries(
    siteIds.map((id) => [id, siteStats[id] ? siteStats[id][valueField] : 0])
  ),
})

/**
 * Apply filters to table and calculate the total for each filtered dimension
 * based on all other filters (but not its own) and total for each unfiltered
 * dimension.
 * @returns Object with filtered table, preFilteredTable, and dimension stats according to aggFuncs
 */
export const applyFilters = ({
  table: rawTable,
  dimensions,
  filters: rawFilters,
  aggFuncs,
  preFilter,
}) => {
  let table = rawTable
  const dimensionStats = {}

  // do a first pass and apply all filters into derived columns so that these
  // can be used later in a filter expression
  const filters = Object.entries(rawFilters)
    /* eslint-disable-next-line no-unused-vars */
    .filter(([field, values]) => values && values.size > 0)
    .map(([field, values]) => {
      if (dimensions[field].isArray) {
        table = table.derive({
          [`${field}_filter`]: escape((d) => op.hasAny([...values], d[field])),
        })
      } else {
        table = table.derive({
          [`${field}_filter`]: escape((d) => op.has(values, d[field])),
        })
      }

      return field
    })

  // loop over filter in filters, apply all other filters except self
  // (so that we can get distribution for self) and then calculate totals for
  // other fields
  filters.forEach((field) => {
    const fields = filters
      .filter((otherField) => otherField !== field)
      .map((otherField) => `${otherField}_filter`)

    // filter in rows where all filter values are present
    const filteredTable = table.filter(
      escape((d) => fields.filter((f) => d[f]).length === fields.length)
    )

    dimensionStats[field] = aggregateByGroup(
      preFilter ? filteredTable.filter(preFilter) : filteredTable,
      field,
      aggFuncs
    )
  })

  // apply all filters and update dimension counts for every dimension that
  // doesn't have a filter
  const fields = filters.map((field) => `${field}_filter`)
  if (fields.length > 0) {
    table = table.filter(
      escape((d) => fields.filter((f) => d[f]).length === fields.length)
    )
  }

  const prefilteredTable = preFilter ? table.filter(preFilter) : table

  // update dimension totals for every dimension that is not filtered
  Object.values(dimensions)
    .filter(({ field }) => !(rawFilters[field] && rawFilters[field].size > 0))
    .forEach((dimension) => {
      const { field } = dimension
      dimensionStats[field] = aggregateByGroup(
        prefilteredTable,
        field,
        aggFuncs
      )
    })

  return {
    table,
    prefilteredTable,
    dimensionStats,
  }
}

/** *********************** FIXME: remove, old below ******************** */

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
  const values = crossfilter.all().map((d) => d[valueField])
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
    ).filter((v) => v > 0).length
  }

  return groupAll()
    .reduceSum((d) => d[valueField])
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

// export const aggregateByDimension = (dimensions, valueField = null) =>
//   Object.values(dimensions)
//     .filter(({ config: { internal } }) => !internal)
//     .map(({ group, config: { field } }) => {
//       let sums = null

//       switch (valueField) {
//         case null: {
//           sums = group().all()
//           break
//         }
//         case 'id': {
//           sums = group()
//             .reduce(...groupReducer(valueField))
//             .all()
//             // only keep values > 0, and retain count of entries instead of values
//             .map(({ key, value }) => ({
//               key,
//               value: Object.values(value).filter((v) => v > 0).length,
//             }))
//           break
//         }
//         case 'species': {
//           sums = group()
//             // only retain entries for species that have nonzero detectionNights
//             .reduce(
//               ...filteredGroupReducer(valueField, (d) => d.detectionNights > 0)
//             )
//             .all()
//             // only keep values > 0, and retain count of entries instead of values
//             .map(({ key, value }) => ({
//               key,
//               value: Object.values(value).filter((v) => v > 0).length,
//             }))
//           break
//         }
//         default: {
//           sums = group()
//             .reduceSum((d) => d[valueField])
//             .all()
//           break
//         }
//       }

//       // reduce [{key:..., value:...},...] for each entry into {key: value, ...}
//       return {
//         field,
//         total: sums.reduce(...reduceToObject('key', (d) => d.value)),
//       }
//     })
//     .reduce(...reduceToObject('field', (d) => d.total))
