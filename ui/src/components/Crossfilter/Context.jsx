/* eslint-disable no-console */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import PropTypes from 'prop-types'

import { isDebug } from 'util/dom'

// import { Crossfilter } from './Crossfilter'
import {
  aggregateByDimension,
  aggregateByHex,
  applyFilters,
  createDimensions,
  getFilteredTotal,
  getTotal,
  getDistinctValues,
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
  metric: initMetric,
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

    const { aggFunc, dimensionPrefilter } = initMetric
    const prefilteredTable = dimensionPrefilter
      ? table.filter(dimensionPrefilter)
      : table

    const total = getTotal(prefilteredTable, aggFunc)

    const initialState = {
      metric: initMetric,

      filters: {},
      hasFilters: false,
      total,
      dimensionTotals: aggregateByDimension(
        prefilteredTable,
        dimensions,
        aggFunc
      ),
      h3Totals: aggregateByHex(prefilteredTable, table, aggFunc),
      siteIds: getDistinctValues(table, 'siteId'),
      filteredTable: table,
      filteredTotal: total,

      // FIXME: remove; superseded by hasFilters
      // hasVisibleFilters: false,
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
          metric,
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
          dimensionTotals,
        } = applyFilters(table, dimensions, newFilters, metric)

        const hasFilters =
          Object.values(newFilters).filter(
            (filter) => filter && filter.size > 0
          ).length > 0

        const { aggFunc } = metric

        const newState = {
          ...prevState,

          filters: newFilters,
          hasFilters,
          dimensionTotals,
          h3Totals: aggregateByHex(prefilteredTable, table, aggFunc),
          siteIds: getDistinctValues(filteredTable, 'siteId'),
          filteredTable,
          filteredTotal: getTotal(prefilteredTable, aggFunc),
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

  // TODO: reimplement as filter against visible hexes or sites
  // const setBounds = useCallback(
  //   (bounds) => {
  //     if (!(dimensions.lat && dimensions.lon)) {
  //       console.warn(
  //         'Filter requested on spatial dimensions that do not exist.  Must be configured as lat, lon when Crossfilter is constructed.'
  //       )
  //     }

  //     setState((prevState) => {
  //       if (isDebug) {
  //         console.log('setBounds', bounds)
  //         console.log('Prev state', prevState)
  //       }

  //       const { lat, lon } = dimensions

  //       if (bounds === null) {
  //         lat.filterAll()
  //         lon.filterAll()
  //       } else {
  //         const [xmin, ymin, xmax, ymax] = bounds
  //         lon.filterRange([xmin, xmax])
  //         lat.filterRange([ymin, ymax])
  //       }

  //       const { valueField } = prevState

  //       const newState = {
  //         ...prevState,
  //         data: crossfilter.allFiltered(),
  //         dimensionTotals: aggregateByDimension(dimensions, valueField),
  //         filteredTotal: getFilteredTotal(crossfilter, valueField),
  //       }

  //       if (isDebug) {
  //         console.log('Next state', newState)
  //       }

  //       return newState
  //     })
  //   },
  //   [table]
  // )
  const setBounds = useCallback(() => {}, [])

  const resetFilters = useCallback(
    () => {
      setState((prevState) => {
        if (isDebug) {
          console.log('Reset filters')
          console.time('reset filters')
        }

        // TODO: possible optimization: can restore initial state if metric === initMetric
        const {
          metric: { aggFunc, dimensionPrefilter },
        } = prevState

        const prefilteredTable = dimensionPrefilter
          ? table.filter(dimensionPrefilter)
          : table

        const total = getTotal(prefilteredTable, aggFunc)

        const newState = {
          ...prevState,
          filters: {},
          hasFilters: false,
          total,
          dimensionTotals: aggregateByDimension(
            prefilteredTable,
            dimensions,
            aggFunc
          ),
          h3Totals: aggregateByHex(prefilteredTable, table, aggFunc),
          siteIds: getDistinctValues(table, 'siteId'),
          filteredTable: table,
          filteredTotal: total,
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
        }

        const newState = {
          ...prevState,
          valueField: newValueField,
          dimensionTotals: aggregateByDimension(dimensions, newValueField),
          filteredTotal: getFilteredTotal(crossfilter, newValueField),
          // total: getRawTotal(crossfilter, valueField),
          total: getTotal(table, newValueField),
        }

        if (isDebug) {
          console.log('Next state', newState)
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
      setBounds,
      resetFilters,
      setValueField,
    }),
    [setFilter, setBounds, resetFilters, setValueField]
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
  metric: PropTypes.shape({
    label: PropTypes.string.isRequired,
    // used in table.rollup() to calculate total
    aggFunc: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
    // used to pre-filter table before calculating dimension totals
    dimensionPrefilter: PropTypes.func,
  }).isRequired,
  // valueField: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
}

export const useCrossfilter = () => ({
  state: useContext(StateContext),
  ...useContext(DispatchContext),
})
