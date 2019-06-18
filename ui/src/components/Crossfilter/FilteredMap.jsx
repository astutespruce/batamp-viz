/** A wrapper for the map to inject context from crossfilter so that the map doesn't need to know anything about crossfilter */

import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { Set, Map as ImmutableMap } from 'immutable'

import { sumBy, countUniqueBy, uniqueBy, uniqueMapBy } from 'util/data'
import { useIsEqualMemo } from 'util/hooks'
import Map from 'components/Map'
import { useCrossfilter } from './Context'

const FilteredMap = ({
  detectors: rawDetectors,
  filterByBounds,
  onBoundsChange,
  ...props
}) => {
  const { setBounds, state } = useCrossfilter()
  const filterByBoundsRef = useRef(filterByBounds)

  // TODO: should use bounds after map first loads
  const boundsRef = useRef(null)

  useEffect(() => {
    filterByBoundsRef.current = filterByBounds

    // reset existing bounds filter if needed, or enable it to the last bounds
    setBounds(filterByBounds ? boundsRef.current : null)
  }, [filterByBounds])

  const handleBoundsChange = bounds => {
    boundsRef.current = bounds

    onBoundsChange(bounds)

    // do not filter if this is not enabled
    if (!filterByBoundsRef.current) return

    setBounds(bounds)
  }

  // total of current valueField by ID
  // const totals = state.get('dimensionTotals').get('id')
  // const totalByID = state
  //   .get('dimensionTotalsById', ImmutableMap())
  //   .get('timestep', ImmutableMap())

  const valueField = state.get('valueField')

  // NOTE: this is only the total for all applied filters
  // TODO: this assumes timestep is not split out as a separate filter when
  // animating time!
  const data = state.get('data')

  const filteredIds = useIsEqualMemo(() => Set(data.map(d => d.get('id'))), [
    data,
  ])

  const totalById = useIsEqualMemo(() => {
    switch (valueField) {
      case 'id': {
        return sumBy(data, 'id', 'detectionNights').map(total =>
          total > 0 ? 1 : 0
        )
      }
      case 'species': {
        // only count species that were actually detected
        return countUniqueBy(
          data.filter(d => d.get('detectionNights', 0) > 0),
          'id',
          'species'
        )
      }
      default: {
        return sumBy(data, 'id', valueField)
      }
    }
  }, [data, valueField])

  const maxValue = totalById.size
    ? Math.max(...Array.from(totalById.values()))
    : 0

  // Only show the detectors that currently meet the applied filters
  const detectors = useIsEqualMemo(
    () =>
      rawDetectors
        .filter(d => filteredIds.has(d.get('id')))
        .map(d =>
          d
            .filter((_, k) => k === 'id' || k === 'lat' || k === 'lon')
            .merge({
              total: totalById.get(d.get('id'), 0),
              max: totalById.get(d.get('id'), 0),
            })
        ),
    [filteredIds, totalById]
  )

  return (
    <Map
      detectors={detectors}
      valueField={valueField}
      maxValue={maxValue}
      hasFilters={state.get('hasVisibleFilters')}
      onBoundsChange={handleBoundsChange}
      {...props}
    />
  )
}

FilteredMap.propTypes = {
  detectors: ImmutablePropTypes.listOf(
    ImmutablePropTypes.mapContains({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
    })
  ).isRequired,
  filterByBounds: PropTypes.bool,
  onBoundsChange: PropTypes.func,
}

FilteredMap.defaultProps = {
  filterByBounds: true,
  onBoundsChange: () => {},
}

export default FilteredMap
