import React from 'react'
import PropTypes from 'prop-types'

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
          onClick={() => onToggleFilter(value)}
        />
      ))}
    </>
  )
}

HorizontalBars.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])})).isRequired,
  max: PropTypes.number.isRequired,
  onToggleFilter: PropTypes.func.isRequired,
}

export default HorizontalBars
