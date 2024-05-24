import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'
import { Box, Flex } from 'theme-ui'

import VerticalBar from './VerticalBar'

const BarChart = ({ data, max, onToggleFilter }) => {
  // scale is based on percent of container
  const scale = scaleLinear().domain([1, max]).range([6, 100])

  return (
    <Box sx={{ mb: '0.5rem', height: '100px', overflow: 'hidden' }}>
      <Flex
        sx={{
          flexWrap: 'no-wrap',
          alignItems: 'baseline',
          justifyContent: 'space-evenly',
          position: 'relative',
          height: '100%',
          pt: '1rem',
        }}
      >
        {data.map(({ value, ...props }) => (
          <VerticalBar
            key={value}
            value={value}
            {...props}
            max={max}
            scale={scale}
            onClick={() => onToggleFilter(value)}
          />
        ))}
      </Flex>
    </Box>
  )
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  max: PropTypes.number.isRequired,
  onToggleFilter: PropTypes.func.isRequired,
}

export default BarChart
