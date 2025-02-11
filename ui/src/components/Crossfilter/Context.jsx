/* eslint-disable no-console */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import PropTypes from 'prop-types'

import { H3_COLS, METRICS } from 'config'
import { isDebug } from 'util/dom'

import {
  aggregateByDimension,
  applyFiltersAndAggregate,
  createDimensions,
  getDistinctValues,
  aggregateByGroup,
  getTotals,
} from './util'

/**
 * Provide Crossfilter as a context so that components deeper in the
 * component tree can access crossfilter state or dispatch.
 */
const StateContext = createContext()
const DispatchContext = createContext()

export const Provider = ({
  table,
  filters: filterConfig,
  valueField: initValueField,
  aggFuncs,
  deriveFuncs = {},
  preFilter = null,
  children,
}) => {
  const dimensions = useMemo(
    () => createDimensions(filterConfig),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  )

  if (isDebug) {
    window.dimensions = dimensions
  }

  const [state, setState] = useState(() => {
    if (isDebug) {
      window.table = table
      console.time('initialize state')
      console.time('aggregate stats')
    }

    const prefilteredTable = preFilter ? table.filter(preFilter) : table

    // aggregate by aggFuncs at all levels; these all use preFilter when provided
    const topLevelStats = prefilteredTable
      .rollup(aggFuncs)
      .derive(deriveFuncs)
      .objects()[0]

    // calculate stats per dimension for each aggFunc
    const dimensionStats = aggregateByDimension(
      prefilteredTable,
      dimensions,
      aggFuncs,
      deriveFuncs
    )

    // calculate stats per hex level and hex ID for each aggFunc
    const h3Stats = Object.fromEntries(
      H3_COLS.map((col) => [
        col,
        aggregateByGroup(prefilteredTable, col, aggFuncs, deriveFuncs),
      ])
    )

    // calculate stats per site for each aggFunc
    const siteStats = aggregateByGroup(
      prefilteredTable,
      'siteId',
      aggFuncs,
      deriveFuncs
    )

    if (isDebug) {
      console.timeEnd('aggregate stats')
      console.time('aggregate locations')
    }

    // calculate location IDs that were surveyed
    // NOTE: any location that was not surveyed is not present in the source data
    const h3Ids = Object.fromEntries(
      H3_COLS.map((col) => [col, getDistinctValues(table, col)])
    )

    // calculate uniqe siteIDs that were surveyed
    const siteIds = getDistinctValues(table, 'siteId')

    if (isDebug) {
      console.timeEnd('aggregate locations')
    }

    // extract totals for valueField from the statistics above, backfilling with
    // 0 where the hex / site is not present in stats
    const { total, dimensionTotals, h3Totals, siteTotals } = getTotals({
      topLevelStats,
      dimensionStats,
      h3Stats,
      siteStats,
      h3Ids,
      siteIds,
      valueField: initValueField,
    })

    const initialState = {
      // save the original dimensions for other consumers
      dimensions,

      // save the original stats, which do not change based on filters or valueField
      initialTopLevelStats: topLevelStats,

      // metric changes when valueField changes
      metric: {
        field: initValueField,
        total, // store to display as the total possible for this field
        ...METRICS[initValueField],
      },

      // following values are updated when filters change
      filters: {},
      hasFilters: false,
      filteredTable: table,
      // prefiltered stats
      topLevelStats,
      dimensionStats,
      h3Stats,
      siteStats,
      // surveyed locations
      h3Ids,
      siteIds,
      // totals backfilled with 0's, update when filters or valueField changes
      total,
      dimensionTotals,
      h3Totals,
      siteTotals,
    }

    if (isDebug) {
      console.log('Initial state', initialState)
      console.timeEnd('initialize state')
    }

    return initialState
  })

  const setFilter = useCallback(
    (filterField, filterValue) => {
      if (!dimensions[filterField]) {
        console.warn(
          `Filter requested on dimension that does not exist: ${filterField}`
        )
      }

      setState((prevState) => {
        if (isDebug) {
          console.log('setFilter', filterField, filterValue)
          console.log('Prev state', prevState)
          console.time('setFilter')
        }

        const {
          metric: { field: valueField },
          // discard prev filter for this field and create a new one (don't mutate it)
          filters: { [filterField]: prevFilter, ...prevFilters },
        } = prevState

        const newFilters = { ...prevFilters }

        // only set filter if filter is non-empty
        if (filterValue && filterValue.size) {
          newFilters[filterField] = filterValue
        }

        // recalculate table, pre-filtered table, and stats by dimension based
        // on the updated filters
        const {
          table: filteredTable,
          prefilteredTable,
          dimensionStats,
        } = applyFiltersAndAggregate({
          table,
          dimensions,
          filters: newFilters,
          aggFuncs,
          deriveFuncs,
          preFilter,
        })

        if (isDebug) {
          window.filteredTable = filteredTable
        }

        // recalculate top-level stats for each aggFunc based on updated filters
        const topLevelStats = prefilteredTable
          .rollup(aggFuncs)
          .derive(deriveFuncs)
          .objects()[0]

        // recalculate hex and site stats for each aggFunc based on updated filters
        const h3Stats = Object.fromEntries(
          H3_COLS.map((col) => [
            col,
            aggregateByGroup(prefilteredTable, col, aggFuncs, deriveFuncs),
          ])
        )
        const siteStats = aggregateByGroup(
          prefilteredTable,
          'siteId',
          aggFuncs,
          deriveFuncs
        )

        // extract the hex and site IDs present after applying filters
        const h3Ids = Object.fromEntries(
          H3_COLS.map((col) => [col, getDistinctValues(filteredTable, col)])
        )
        const siteIds = getDistinctValues(filteredTable, 'siteId')

        // recalculate the totals based on the stats for the updated filters
        const { total, dimensionTotals, h3Totals, siteTotals } = getTotals({
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          h3Ids,
          siteIds,
          valueField,
        })

        const newState = {
          ...prevState,

          filters: newFilters,
          hasFilters:
            Object.values(newFilters).filter(
              (filter) => filter && filter.size > 0
            ).length > 0,

          filteredTable,
          // prefiltered stats
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          // surveyed locations
          h3Ids,
          siteIds,
          // totals backfilled with 0's, update when filters or valueField changes
          total,
          dimensionTotals,
          h3Totals,
          siteTotals,
        }

        if (isDebug) {
          console.log('Next state', newState)
          console.timeEnd('setFilter')
        }

        return newState
      })
    },

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  )

  const resetFilters = useCallback(
    () => {
      setState((prevState) => {
        if (isDebug) {
          console.log('Reset filters')
          console.time('reset filters')
        }

        const {
          metric: { field: valueField },
        } = prevState

        const prefilteredTable = preFilter ? table.filter(preFilter) : table

        // aggregate by aggFuncs at all levels; these all use preFilter when provided
        const topLevelStats = prefilteredTable
          .rollup(aggFuncs)
          .derive(deriveFuncs)
          .objects()[0]
        const dimensionStats = aggregateByDimension(
          prefilteredTable,
          dimensions,
          aggFuncs,
          deriveFuncs
        )
        const h3Stats = Object.fromEntries(
          H3_COLS.map((col) => [
            col,
            aggregateByGroup(prefilteredTable, col, aggFuncs, deriveFuncs),
          ])
        )
        const siteStats = aggregateByGroup(
          prefilteredTable,
          'siteId',
          aggFuncs,
          deriveFuncs
        )

        // aggregate location IDs that were surveyed
        const h3Ids = Object.fromEntries(
          H3_COLS.map((col) => [col, getDistinctValues(table, col)])
        )
        const siteIds = getDistinctValues(table, 'siteId')

        const { total, dimensionTotals, h3Totals, siteTotals } = getTotals({
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          h3Ids,
          siteIds,
          valueField,
        })

        const newState = {
          ...prevState,

          filters: {},
          hasFilters: false,
          filteredTable: table,
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          h3Ids,
          siteIds,
          total,
          dimensionTotals,
          h3Totals,
          siteTotals,
        }

        if (isDebug) {
          console.log('Next state', newState)
          console.timeEnd('reset filters')
        }

        return newState
      })
    },

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  )

  const setValueField = useCallback(
    (newValueField) => {
      setState((prevState) => {
        if (isDebug) {
          console.log('setValueField', newValueField)
          console.log('Prev state', prevState)
          console.time('setValueField')
        }

        const {
          initialTopLevelStats,
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          h3Ids,
          siteIds,
        } = prevState

        // extract totals for the new value field; these stats were pre-calculated
        // based on the current filters and don't need to be recalculated here
        const { total, dimensionTotals, h3Totals, siteTotals } = getTotals({
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          h3Ids,
          siteIds,
          valueField: newValueField,
        })

        const newState = {
          ...prevState,
          total,
          dimensionTotals,
          h3Totals,
          siteTotals,
          metric: {
            field: newValueField,
            total: initialTopLevelStats[newValueField] || 0,
            ...METRICS[newValueField],
          },
        }

        if (isDebug) {
          console.log('Next state', newState)
          console.timeEnd('setValueField')
        }

        return newState
      })
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  )

  const dispatchFunctions = useMemo(
    () => ({
      setFilter,
      resetFilters,
      setValueField,
    }),
    [setFilter, resetFilters, setValueField]
  )

  // We use nested context providers below to split up the parts of the context that are changing frequently (the state)
  // from the parts that are not changing once defined (the callback functions)
  return (
    <DispatchContext.Provider value={dispatchFunctions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  )
}

Provider.propTypes = {
  table: PropTypes.object.isRequired,
  filters: PropTypes.array.isRequired,
  valueField: PropTypes.string.isRequired,
  // aggFuncs is a mapping of output key to the aggregation applied to the input field
  // these will be recalculated on every change to the filter state
  aggFuncs: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  ).isRequired,
  // deriveFuncs is a mapping of output key to the derived method applied to the
  // data table after applying aggFuncs
  deriveFuncs: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  ),
  // preFilter is used to pre-filter table before calculating dimension totals
  // this is only used from the occurrence map where the statistic is number of
  // species
  preFilter: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
}

Provider.defaultProps = {
  deriveFuncs: {},
  preFilter: null,
}

export const useCrossfilter = () => ({
  state: useContext(StateContext),
  ...useContext(DispatchContext),
})
