/** A wrapper for the map to inject context from crossfilter so that the map doesn't need to know anything about crossfilter */

import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'

import { sumBy, countUniqueBy, mapValues } from 'util/data'
import { useIsEqualMemo } from 'util/hooks'
import Map from 'components/Map'
import { useCrossfilter } from './Context'

const FilteredMap = ({
  detectors,
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

  const valueField = state.get('valueField')
  const data = state.get('data')
  const filteredIds = useIsEqualMemo(() => {
    return new Set(data.map(({ id }) => id))
  }, [data])

  // Any detector not included below can be assumed to have a total of 0
  const totalById = useIsEqualMemo(() => {
    // only tally records where species were detected
    const filteredData = data.filter(d => (d.detectionNights || 0) > 0)

    switch (valueField) {
      case 'id': {
        // only return 1 as stand in as count for a given detector so that
        // other tallies work correctly
        return mapValues(sumBy(filteredData, 'id', 'detectionNights'), total =>
          total > 0 ? 1 : 0
        )
      }
      case 'species': {
        return countUniqueBy(filteredData, 'id', 'species')
      }
      default: {
        return sumBy(filteredData, 'id', valueField)
      }
    }
  }, [data, valueField])

  const maxValue = Math.max(...Object.values(totalById))

  // Only show the detectors that currently meet the applied filters
  const filteredDetectors = useIsEqualMemo(
    () =>
      detectors
        .filter(d => filteredIds.has(d.get('id')))
        .map(d =>
          d
            // .filter((_, k) => k === 'id' || k === 'lat' || k === 'lon')
            .merge({
              total: totalById[d.get('id')] || 0,
              max: totalById[d.get('id')] || 0,
            })
        ),
    [filteredIds, totalById]
  )

  return (
    <Map
      detectors={filteredDetectors}
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
