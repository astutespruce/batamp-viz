import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'
import { Box, Flex } from 'theme-ui'

import { formatNumber } from 'util/format'
import VerticalBar from './VerticalBar'

const VerticalBars = ({ data, max, onToggleFilter }) => {
  // scale is based on percent of container (which are 100px)
  const scale = scaleLinear().domain([0, max]).range([0, 100]).nice()

  return (
    <Flex
      sx={{
        flexWrap: 'nowrap',
        mt: '1rem',
        mb: '1.5rem',
        mr: '1rem',
        position: 'relative',
        height: '100px',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: '0 0 auto',
          lineHeight: 1,
          fontSize: '0.6rem',
          textAlign: 'right',
          width: scale.domain()[1] > 1000 ? '3.5em' : '1.5rem',
        }}
      >
        {scale.ticks(3).map((d) => (
          <Box
            key={d}
            sx={{
              lineHeight: 1,
              position: 'absolute',
              right: '4px',
              bottom: `calc(${scale(d)}px - 0.25rem)`,
            }}
          >
            {formatNumber(d)}
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          ml: '2px',
          bottom: '1rem',
          top: 0,
          right: 0,
          left: scale.domain()[1] >= 1000 ? '2rem' : '1.4rem',
          height: '100px',
        }}
      >
        {scale.ticks(3).map((d) => (
          <Box
            key={d}
            sx={{
              zIndex: 0,
              position: 'absolute',
              bottom: `${scale(d)}px`,
              left: 0,
              right: 0,
              borderBottom: '1px dotted',
              borderBottomColor: 'grey.2',
            }}
          />
        ))}
      </Box>

      <Flex
        sx={{
          flex: '1 1 auto',
          borderRight: '1px solid',
          borderRightColor: 'grey.2',
          borderLeft: '1px solid',
          borderLeftColor: 'grey.2',
        }}
      >
        {data.map(({ value, ...props }, i) => (
          <VerticalBar
            key={value}
            value={value}
            {...props}
            max={max}
            scale={scale}
            showLabel={data.length < 16 || i % 2 === 0}
            onClick={() => onToggleFilter(value)}
          />
        ))}
      </Flex>
    </Flex>
  )
}

VerticalBars.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  max: PropTypes.number.isRequired,
  onToggleFilter: PropTypes.func.isRequired,
}

export default VerticalBars
