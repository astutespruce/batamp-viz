import { useState, useMemo } from 'react'
import { Map, List } from 'immutable'
import Crossfilter2 from 'crossfilter2'
import { isDebug } from 'util/dom'
import {
  aggregateByDimension,
  getRawTotal,
  getFilteredTotal,
  // aggregateDimensionById,
} from './util'

// returns true if passed in values contains the value
// values must be a Set
export const hasValue = filterValues => value => filterValues.has(value)

/**
 * Initialize crossfilter from the data and filters
 * @param {ImmutableJS List} data - list of records to index
 * @param {Array} filters - array of field configuration
 */
const initCrossfilter = (data, filters) => {
  const crossfilter = Crossfilter2(data.toArray())

  const dimensions = {}
  filters.forEach(filter => {
    const { field, isArray, getValue } = filter
    // default `getValue` function is identify function for field
    // const dimensionFunction = getValue || (d => d[field])
    const dimensionFunction =
      getValue ||
      (record => {
        const value = record.get(field)
        // if incoming value is an immutableJS object, convert it to JS first
        if (value && value.toJS !== undefined) {
          return value.toJS()
        }
        return value
      })

    const dimension = crossfilter.dimension(dimensionFunction, !!isArray)
    dimension.config = filter
    dimensions[field] = dimension
  })

  if (isDebug) {
    window.crossfilter = crossfilter
    window.dimensions = dimensions
  }
  return {
    crossfilter,
    dimensions,
  }
}

export const Crossfilter = (data, filters, options = {}) => {
  // Memoize construction of crossfilter and dimensions, so they only get created once
  const { crossfilter, dimensions } = useMemo(() => {
    return initCrossfilter(data, filters)
  }, [])

  // create the initial state in the callback so that we only construct it once
  const [state, setState] = useState(() => {
    const valueField = options.valueField || null
    const total = getRawTotal(crossfilter, valueField)
    const initialState = Map({
      // passed in data
      data,
      valueField,

      // derived data
      total,
      filteredTotal: total,
      filters: Map(),
      hasVisibleFilters: false,
      dimensionTotals: aggregateByDimension(dimensions, valueField),

      // Not used:
      // dimensionTotalsById: aggregateDimensionById(dimensions, valueField),
    })

    if (isDebug) {
      console.log('Initial state', initialState.toJS())
    }

    return initialState
  })

  const setFilter = (field, filterValue) => {
    if (!dimensions[field]) {
      console.warn(
        `Filter requested on dimension that does not exist: ${field}`
      )
    }

    setState(prevState => {
      if (isDebug) {
        console.log('setFilter', field, filterValue)
        console.log('Prev state', prevState.toJS())
      }

      const dimension = dimensions[field]
      if (!filterValue || filterValue.size === 0) {
        // there are no filter values, so clear filter on this field
        dimension.filterAll()
      } else {
        // default to hasValue if filterFunc is not provided in config
        const {
          config: { filterFunc = hasValue },
        } = dimension
        dimension.filterFunction(filterFunc(filterValue))
      }

      const valueField = prevState.get('valueField')
      const newFilters = prevState.get('filters').set(field, filterValue)
      const hasVisibleFilters =
        newFilters.filter(
          (v, k) => !v.isEmpty() && !dimensions[k].config.internal
        ).size > 0

      const newState = prevState.merge({
        // convert Array from crossfilter back to an immutable List
        data: List(crossfilter.allFiltered()),
        filters: newFilters,
        hasVisibleFilters,
        dimensionTotals: aggregateByDimension(dimensions, valueField),
        filteredTotal: getFilteredTotal(crossfilter, valueField),

        // Not used:
        // dimensionTotalsById: aggregateDimensionById(dimensions, valueField),
      })

      if (isDebug) {
        console.log('Next state', newState.toJS())
      }

      return newState
    })
  }

  const setBounds = bounds => {
    if (!(dimensions.lat && dimensions.lon)) {
      console.warn(
        'Filter requested on spatial dimensions that do not exist.  Must be configured as lat, lon when Crossfilter is constructed.'
      )
    }

    setState(prevState => {
      if (isDebug) {
        console.log('setBounds', bounds)
        console.log('Prev state', prevState.toJS())
      }

      const { lat, lon } = dimensions

      if (bounds === null) {
        lat.filterAll()
        lon.filterAll()
      } else {
        const [xmin, ymin, xmax, ymax] = bounds
        lon.filterRange([xmin, xmax])
        lat.filterRange([ymin, ymax])
      }

      const valueField = prevState.get('valueField')

      const newState = prevState.merge({
        // convert Array from crossfilter back to an immutable List
        data: List(crossfilter.allFiltered()),
        // filters: state.get('filters').set(field, filterValue),
        dimensionTotals: aggregateByDimension(dimensions, valueField),
        filteredTotal: getFilteredTotal(crossfilter, valueField),

        // Not used:
        // dimensionTotalsById: aggregateDimensionById(dimensions, valueField),
      })

      if (isDebug) {
        console.log('Next state', newState.toJS())
      }

      return newState
    })
  }

  const resetFilters = fields => {
    setState(prevState => {
      if (isDebug) {
        console.log('resetFilters', fields)
        console.log('Prev state', prevState.toJS())
      }

      // reset the filters on the dimenions
      fields.forEach(field => {
        dimensions[field].filterAll()
      })

      const valueField = prevState.get('valueField')

      const newFilters = prevState.get('filters').removeAll(fields)
      const hasVisibleFilters =
        newFilters.filter(
          (v, k) => !v.isEmpty() && !dimensions[k].config.internal
        ).size > 0

      const newState = state.merge({
        // convert Array from crossfilter back to an immutable List
        data: List(crossfilter.allFiltered()),
        // remove all filter entries for these fields
        filters: newFilters,
        hasVisibleFilters,
        dimensionTotals: aggregateByDimension(dimensions, valueField),
        filteredTotal: getFilteredTotal(crossfilter, valueField),

        // Not used:
        // dimensionTotalsById: aggregateDimensionById(dimensions, valueField),
      })

      if (isDebug) {
        console.log('Next state', newState.toJS())
      }

      return newState
    })
  }

  const setValueField = valueField => {
    setState(prevState => {
      if (isDebug) {
        console.log('setValueField', valueField)
        console.log('Prev state', prevState.toJS())
      }

      const newState = prevState.merge({
        valueField,
        dimensionTotals: aggregateByDimension(dimensions, valueField),
        filteredTotal: getFilteredTotal(crossfilter, valueField),
        total: getRawTotal(crossfilter, valueField),

        // Not used:
        // dimensionTotalsById: aggregateDimensionById(dimensions, valueField),
      })

      if (isDebug) {
        console.log('Next state', newState.toJS())
      }

      return newState
    })
  }

  return {
    setFilter,
    setBounds,
    resetFilters,
    setValueField,
    state,
  }
}
