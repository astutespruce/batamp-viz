import { addFunction, op, escape } from 'arquero'

import { H3_COLS } from 'config'

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
