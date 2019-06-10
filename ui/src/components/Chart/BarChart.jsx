import React from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import { Text } from 'components/Text'
import { formatNumber } from 'util/format'
import styled, { css, themeGet } from 'style'

const Wrapper = styled.div`
  ${({ highlight }) =>
    highlight &&
    css`


  ${Title}, ${Subtitle}, ${ValueLabel} {
    color: ${themeGet('colors.highlight.500')};
  }

  ${Bar} {
    background-color: ${themeGet('colors.highlight.500')};
    border-top-color: ${themeGet('colors.highlight.600')};
  }
  `}
`

const Title = styled(Text)`
  color: ${themeGet('colors.grey.900')};
`

const Subtitle = styled.span`
  margin-left: 0.5em;
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.700')};
`

const Bars = styled(Flex).attrs({
  flexWrap: 'no-wrap',
  justifyContent: 'space-evenly',
})`
  flex: 1;
`

const Column = styled.div`
  flex: 1;
`

const BarWrapper = styled(Flex).attrs({
  flexDirection: 'column',
  justifyContent: 'flex-end',
})`
  height: ${({ height }) => height}px;
  border-bottom: 1px solid ${themeGet('colors.grey.200')};
`

// height set dynamically using style
const Bar = styled.div`
  background-color: ${themeGet('colors.primary.400')};
  border-top: 2px solid ${themeGet('colors.primary.600')};
  border-left: 1px solid ${themeGet('colors.grey.200')};
  border-right: 1px solid ${themeGet('colors.grey.200')};
`

const EmptyBar = styled(Bar)`
  border: none;
`

const Label = styled(Text).attrs({ fontSize: '0.6rem' })`
  color: ${themeGet('colors.grey.600')};
  text-align: center;
`

const ValueLabel = styled(Text)`
  font-size: 0.6rem;
  color: ${themeGet('colors.grey.800')};
  text-align: center;
  flex: 0;
`

const BarChart = ({ title, subtitle, data, scale, highlight }) => {
  const max = Math.max(...data.map(({ value }) => value))
  const maxHeight = Math.max(scale(max), 32)

  return (
    <Wrapper highlight={highlight}>
      <Title>
        {title}

        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      </Title>

      <Bars>
        {data.map(({ label, value }) => (
          <Column key={label}>
            <BarWrapper height={maxHeight}>
              {value > 0 ? (
                <>
                  <ValueLabel>{formatNumber(value)}</ValueLabel>
                  <Bar style={{ flexBasis: scale(value) }} />
                </>
              ) : (
                <EmptyBar />
              )}
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
}

BarChart.defaultProps = {
  subtitle: null,
  highlight: false,
}

export default BarChart
