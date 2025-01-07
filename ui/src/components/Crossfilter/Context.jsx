/* eslint-disable no-console */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import PropTypes from 'prop-types'

import { H3_COLS, METRIC_LABELS } from 'config'
import { isDebug } from 'util/dom'

import {
  aggregateByDimension,
  applyFilters,
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
  preFilter,
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
    }

    const prefilteredTable = preFilter ? table.filter(preFilter) : table

    if (isDebug) {
      console.time('aggregate stats')
    }

    // aggregate by aggFuncs at all levels; these all use preFilter when provided
    const topLevelStats = prefilteredTable.rollup(aggFuncs).objects()[0]

    const dimensionStats = aggregateByDimension(
      prefilteredTable,
      dimensions,
      aggFuncs
    )

    const h3Stats = Object.fromEntries(
      H3_COLS.map((col) => [
        col,
        aggregateByGroup(prefilteredTable, col, aggFuncs),
      ])
    )

    const siteStats = aggregateByGroup(prefilteredTable, 'siteId', aggFuncs)

    if (isDebug) {
      console.timeEnd('aggregate stats')
      console.time('aggregate locations')
    }

    // aggregate location IDs that were surveyed
    const h3Ids = Object.fromEntries(
      H3_COLS.map((col) => [col, getDistinctValues(table, col)])
    )

    const siteIds = getDistinctValues(table, 'siteId')

    if (isDebug) {
      console.timeEnd('aggregate locations')
    }

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
      // metric changes when valueField changes
      metric: {
        field: initValueField,
        label: METRIC_LABELS[initValueField],
        total,
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
          // discard prev filter
          filters: { [filterField]: prevFilter, ...prevFilters },
        } = prevState

        // Create new instance, don't mutate
        const newFilters = {
          ...prevFilters,
        }

        // only set if filter is non-empty
        if (filterValue && filterValue.size) {
          newFilters[filterField] = filterValue
        }

        const {
          table: filteredTable,
          prefilteredTable,
          dimensionStats,
        } = applyFilters({
          table,
          dimensions,
          filters: newFilters,
          aggFuncs,
          preFilter,
        })

        if (isDebug) {
          window.filteredTable = filteredTable
        }

        const topLevelStats = prefilteredTable.rollup(aggFuncs).objects()[0]
        const h3Stats = Object.fromEntries(
          H3_COLS.map((col) => [
            col,
            aggregateByGroup(prefilteredTable, col, aggFuncs),
          ])
        )
        const siteStats = aggregateByGroup(prefilteredTable, 'siteId', aggFuncs)

        const h3Ids = Object.fromEntries(
          H3_COLS.map((col) => [col, getDistinctValues(filteredTable, col)])
        )
        const siteIds = getDistinctValues(filteredTable, 'siteId')
        const { total, dimensionTotals, h3Totals, siteTotals } = getTotals({
          topLevelStats,
          dimensionStats,
          h3Stats,
          siteStats,
          h3Ids,
          siteIds,
          valueField: initValueField,
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
        const topLevelStats = prefilteredTable.rollup(aggFuncs).objects()[0]
        const dimensionStats = aggregateByDimension(
          prefilteredTable,
          dimensions,
          aggFuncs
        )
        const h3Stats = Object.fromEntries(
          H3_COLS.map((col) => [
            col,
            aggregateByGroup(prefilteredTable, col, aggFuncs),
          ])
        )
        const siteStats = aggregateByGroup(prefilteredTable, 'siteId', aggFuncs)

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
      throw new Error('setValueField not implemented!')
      // setState((prevState) => {
      //   if (isDebug) {
      //     console.log('setValueField', newValueField)
      //     console.log('Prev state', prevState)
      //   }

      //   const newState = {
      //     ...prevState,
      //     valueField: newValueField,
      //     dimensionTotals: aggregateByDimension(dimensions, newValueField),
      //     filteredTotal: getFilteredTotal(crossfilter, newValueField),
      //     // total: getRawTotal(crossfilter, valueField),
      //     total: getTotal(table, newValueField),
      //   }

      //   if (isDebug) {
      //     console.log('Next state', newState)
      //   }

      //   return newState
      // })
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
  aggFuncs: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  ).isRequired,
  // used to pre-filter table before calculating dimension totals
  preFilter: PropTypes.func,
  // valueField: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
}

Provider.defaultProps = {
  preFilter: null,
}

export const useCrossfilter = () => ({
  state: useContext(StateContext),
  ...useContext(DispatchContext),
})
