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
          width: scale.domain()[1] > 1000 ? '3em' : '1rem',
        }}
      >
        {scale.ticks(3).map((d) => (
          <Box
            key={d}
            sx={{
              lineHeight: 1,
              position: 'absolute',
              right: 0,
              bottom: `calc(${scale(d)}px - 0.25rem)`,
            }}
          >
            {formatNumber(d)}
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          ml: '2px',
          bottom: '1rem',
          height: '100px',
          flex: '0 0 auto',
          borderRight: '1px solid',
          borderRightColor: 'grey.2',
          width: '0.5rem',
        }}
      >
        {scale.ticks(3).map((d) => (
          <Box
            key={d}
            sx={{
              position: 'absolute',
              bottom: `${scale(d)}px`,
              width: '0.5rem',
              height: '1px',
              bg: 'grey.5',
            }}
          />
        ))}
      </Box>

      <Flex
        sx={{
          flex: '1 1 auto',
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
