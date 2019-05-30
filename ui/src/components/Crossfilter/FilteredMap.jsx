/** A wrapper for the map to inject context from crossfilter so that the map doesn't need to know anything about crossfilter */

import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { Set } from 'immutable'

import Map from 'components/Map'
import { SET_FILTER } from './Crossfilter'
import { Context } from './Context'

const FilteredMap = ({ detectors: rawDetectors, onBoundsChange, ...props }) => {
  const { state, dispatch } = useContext(Context)

  // const handleBoundsChange = bounds => {
  //   // TODO: persist bounds and convert to immutable throughout stack
  //   dispatch({
  //     type: SET_FILTER,
  //     payload: {
  //       field: 'bounds',
  //       filterValue: bounds,
  //     },
  //   })
  //   onBoundsChange(bounds)
  // }

  // total of current valueField by ID
  const totals = state.get('dimensionTotals').get('id')

  const keys = Set(['id', 'lat', 'lon'])
  const detectors = rawDetectors
    .map(d =>
      d.filter((v, k) => keys.has(k)).merge({ total: totals.get(d.get('id')) })
    )
    .filter(d => d.get('total') > 0)

    // TODO: figure out statistics of those that are visible for rendering

  console.log('detectors', detectors)

  return (
    <Map
      data={state.get('data')}
      detectors={detectors}
      totals={totals}
      // onBoundsChange={handleBoundsChange}
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
  onBoundsChange: PropTypes.func,
}

FilteredMap.defaultProps = {
  onBoundsChange: () => {},
}

export default FilteredMap
