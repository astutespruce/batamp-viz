import React from 'react'
import PropTypes from 'prop-types'

import { Flex, Box } from 'components/Grid'
import { Text } from 'components/Text'
import styled, { themeGet } from 'style'

// input is an array already sorted in the order we want to present it
// [{label, value}, ...]

const Wrapper = styled(Flex).attrs({
  flexWrap: 'no-wrap',
  alignItems: 'baseline',
  justifyContent: 'space-evenly',
})``

const BarWrapper = styled.div`
  flex: 1;
`

// height set dynamically using style
const Bar = styled.div`
  background-color: ${themeGet('colors.primary.500')}aa;
  border-top: 2px solid ${themeGet('colors.grey.500')};
  border-left: 1px solid ${themeGet('colors.grey.200')};
  border-right: 1px solid ${themeGet('colors.grey.200')};
  border-bottom: 1px solid ${themeGet('colors.grey.200')};

  &:hover {
    background-color: ${themeGet('colors.primary.500')};
  }
`

const EmptyBar = styled.div`
  border-top: 1px solid ${themeGet('colors.grey.200')};
`

const Label = styled(Text).attrs({ fontSize: '0.8rem' })`
  color: ${themeGet('colors.grey.600')};
`

const BarChart = ({ data, height }) => {
  const max = Math.max(...data.map(({ value }) => value))

  const calcHeight = value => height * (value / max)

  return (
    <Wrapper>
      {data.map(({ label, value }) => (
        <BarWrapper key={label}>
          {value > 0 ? (
            <Bar style={{ height: calcHeight(value) }} />
          ) : (
            <EmptyBar />
          )}
          <Label>{label}</Label>
        </BarWrapper>
      ))}
    </Wrapper>
  )
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  height: PropTypes.number,
}

BarChart.defaultProps = {
  height: 100,
}

export default BarChart
