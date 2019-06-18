import React, { memo } from 'react'
import PropTypes from 'prop-types'
import deepEqual from 'dequal'

import Bar from './HorizontalBar'

const HorizontalBars = ({ data, max, onToggleFilter }) => {
  return (
    <>
      {data.map(({ value, ...props }) => (
        <Bar
          key={value}
          value={value}
          {...props}
          max={max}
          onClick={onToggleFilter}
        />
      ))}
    </>
  )
}

HorizontalBars.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  max: PropTypes.number.isRequired,
  onToggleFilter: PropTypes.func.isRequired,
}

// Memoize as a function of data
export default memo(
  HorizontalBars,
  ({ data: prevData, max: prevMax }, { data: nextData, max: nextMax }) =>
    deepEqual(prevData, nextData) && prevMax === nextMax
)
