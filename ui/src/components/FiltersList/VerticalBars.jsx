import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'

import { Box, Flex } from 'components/Grid'
import styled from 'style'

import VerticalBar from './VerticalBar'

const Wrapper = styled(Box).attrs({ mb: '.5rem' })`
  height: 100px;
  overflow: hidden;
`

const Bars = styled(Flex).attrs({
  flexWrap: 'no-wrap',
  alignItems: 'baseline',
  justifyContent: 'space-evenly',
})`
  flex: 1;
  position: relative;
  height: 100%;
`

const BarChart = ({ data, max, onToggleFilter }) => {
  // scale is based on percent of container
  const scale = scaleLinear()
    .domain([1, max])
    .range([6, 100])

  return (
    <Wrapper>
      <Bars pt="1rem">
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
      </Bars>
    </Wrapper>
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
