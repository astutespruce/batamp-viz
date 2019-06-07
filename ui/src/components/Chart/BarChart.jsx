import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Flex, Box } from 'components/Grid'
import { Text } from 'components/Text'
import { formatNumber } from 'util/format'
import styled, { themeGet } from 'style'

const Wrapper = styled.div``

export const Title = styled(Text)`
  color: ${({ highlight }) =>
    highlight ? themeGet('colors.highlight.500') : themeGet('colors.grey.900')};
`
const Subtitle = styled.span`
  margin-left: 0.5em;
  font-size: 0.8rem;
  color: ${({ highlight }) =>
    highlight ? themeGet('colors.highlight.500') : themeGet('colors.grey.600')};
`

const Bars = styled(Flex).attrs({
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
  background-color: ${({ highlight }) =>
    highlight
      ? themeGet('colors.highlight.500')
      : themeGet('colors.primary.400')};
  border-top: 2px solid ${({ highlight }) =>
    highlight
      ? themeGet('colors.highlight.600')
      : themeGet('colors.primary.600')};
  border-left: 1px solid ${themeGet('colors.grey.200')};
  border-right: 1px solid ${themeGet('colors.grey.200')};

  opacity: 0.6;

  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  ${BarWrapper}:hover & {
    // background-color: ${themeGet('colors.primary.500')};
    opacity: 1;
  }
`

const EmptyBar = styled(Bar)`
  border: none;
`

const Label = styled(Text).attrs({ fontSize: '0.6rem' })`
  color: ${themeGet('colors.grey.600')};
  text-align: center;
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

const BarChart = ({
  title,
  subtitle,
  data,
  scale,
  highlight,
  showTooltips,
}) => {
  const max = Math.max(...data.map(({ value }) => value))
  const maxHeight = scale(max) + 6

  return (
    <Wrapper>
      <Title highlight={highlight}>
        {title}

        {subtitle ? (
          <Subtitle highlight={highlight}>{subtitle}</Subtitle>
        ) : null}
      </Title>
      <Bars pt={showTooltips ? '1rem' : 0}>
        {data.map(({ label, value }) => (
          <Column key={label}>
            <BarWrapper height={maxHeight}>
              {value > 0 ? (
                <Bar highlight={highlight} style={{ height: scale(value) }} />
              ) : (
                <EmptyBar />
              )}

              <Tooltip>{formatNumber(value)}</Tooltip>
              <TooltipLeader height={maxHeight} />
            </BarWrapper>
            {label ? <Label>{label}</Label> : null}
          </Column>
        ))}
      </Bars>
    </Wrapper>
  )
}

BarChart.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      tooltip: PropTypes.string,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  scale: PropTypes.func.isRequired,
  highlight: PropTypes.bool,
  showTooltips: PropTypes.bool,
}

BarChart.defaultProps = {
  subtitle: null,
  showTooltips: true,
  highlight: false,
}

export default BarChart
