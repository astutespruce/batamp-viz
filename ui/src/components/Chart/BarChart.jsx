import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Flex, Box } from 'components/Grid'
import { Text } from 'components/Text'
import { formatNumber } from 'util/format'
import styled, { themeGet } from 'style'

// input is an array already sorted in the order we want to present it
// [{label, value}, ...]

const Wrapper = styled(Flex).attrs({
  flexWrap: 'no-wrap',
  alignItems: 'baseline',
  justifyContent: 'space-evenly',
})`
  flex: 1;
  position: relative;
`

const Column = styled.div`
  flex: 1;
`

const BarWrapper = styled.div`
  cursor: pointer;
  height: ${({ height }) => height}px;
  position: relative;
  border-bottom: 1px solid ${themeGet('colors.grey.200')};
`

// height set dynamically using style
const Bar = styled.div`
  background-color: ${themeGet('colors.primary.400')}aa;
  border-top: 2px solid ${themeGet('colors.primary.500')};
  border-left: 1px solid ${themeGet('colors.grey.200')};
  border-right: 1px solid ${themeGet('colors.grey.200')};

  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  ${BarWrapper}:hover & {
    background-color: ${themeGet('colors.primary.500')};
  }
`

const EmptyBar = styled(Bar)`
  border: none;
`

const Label = styled(Text).attrs({ fontSize: '0.6rem' })`
  color: ${themeGet('colors.grey.600')};
`

const TooltipLeader = styled.div`
  width: 1px;
  height: ${({ height }) => height}px;
  background: ${themeGet('colors.grey.900')};
  display: none;
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -1px;

  ${BarWrapper}:hover & {
    display: block;
  }
`

const Tooltip = styled(Text)`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.600')};
  position: absolute;
  text-align: center;
  top: -1.25rem;
  left: -2rem;
  right: -2rem;

  display: none;
  ${BarWrapper}:hover & {
    display: block;
  }
`

const BarChart = ({ data, scale, showTooltips }) => {
  const max = Math.max(...data.map(({ value }) => value))
  const maxHeight = scale(max) + 6 // FIXME

  return (
    <Wrapper pt={showTooltips ? '1rem' : 0}>
      {data.map(({ label, value }) => (
        <Column>
          <BarWrapper key={label} height={maxHeight}>
            {value > 0 ? (
              <Bar style={{ height: scale(value) }} />
            ) : (
              <EmptyBar />
            )}

            <Tooltip>{formatNumber(value)}</Tooltip>
            <TooltipLeader height={maxHeight} />
          </BarWrapper>
          {label ? <Label>{label}</Label> : null}
        </Column>
      ))}
    </Wrapper>
  )
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      tooltip: PropTypes.string,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  scale: PropTypes.func.isRequired,
  showTooltips: PropTypes.bool,
}

BarChart.defaultProps = {
  showTooltips: true,
}

export default BarChart
