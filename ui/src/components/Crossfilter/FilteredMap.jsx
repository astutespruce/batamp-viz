/** A wrapper for the map to inject context from crossfilter so that the map doesn't need to know anything about crossfilter */

import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { Set, Map as ImmutableMap } from 'immutable'

import { sumBy } from 'util/data'
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
  const filteredIds = Set(data.map(d => d.get('id')))

  let totalById = ImmutableMap()
  // Note: the totals will only include entries where valueField is > 0
  if (valueField === 'id') {
    // convert to boolean-like values.  1 indicates that it was detected with at least one night.
    totalById = sumBy(data, 'id', 'nights').map(total => (total > 0 ? 1 : 0))
  } else {
    totalById = sumBy(data, 'id', valueField)
  }

  const maxValue = totalById.size
    ? Math.max(...Array.from(totalById.values()))
    : 0

  // Only show the detectors that currently meet the applied filters
  const keys = Set(['id', 'lat', 'lon'])
  const detectors = rawDetectors
    .filter(d => filteredIds.has(d.get('id')))
    .map(d =>
      d
        .filter((_, k) => keys.has(k))
        .merge({ total: totalById.get(d.get('id'), 0) })
    )

  return (
    <Map
      detectors={detectors}
      valueField={valueField}
      maxValue={maxValue}
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
