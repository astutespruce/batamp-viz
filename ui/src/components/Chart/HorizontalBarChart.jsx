import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Text } from 'components/Text'
import { Flex, Columns, Column } from 'components/Grid'
import styled, { css, themeGet } from 'style'
import { formatNumber } from 'util/format'

const Wrapper = styled.div`
  line-height: 1;
  margin-bottom: 1rem;
`

const Label = styled(Text)`
  color: ${themeGet('colors.grey.900')};
`

const Sublabel = styled.span`
  margin-left: 0.5rem;
  color: ${themeGet('colors.grey.700')};
`

const Quantity = styled(Text)`
  color: ${themeGet('colors.grey.700')};
`

const Labels = styled(Columns).attrs({
  justifyContent: 'space-between',
})`
  font-size: 0.8rem;

  ${({ highlight }) =>
    highlight &&
    css`
      ${Label}, ${Sublabel}, ${Quantity} {
        color: ${themeGet('colors.highlight.500')}!important;
      }
  `}
`

const BarWrapper = styled(Flex).attrs({
  flexWrap: 'nowrap',
})`
  height: 1rem;
  background-color: ${themeGet('colors.grey.200')};
  border: 1px solid ${themeGet('colors.grey.200')};
`

const Bar = styled.div`
  background-color: ${({ highlight }) =>
    highlight
      ? themeGet('colors.highlight.500')
      : themeGet('colors.primary.500')};
  flex-grow: ${({ width }) => width};
  transition: flex-grow 300ms;
`

const Filler = styled.div`
  transition: flex-grow 300ms;
`

const HorizontalBarChart = ({ label, sublabel, quantity, max, highlight }) => {
  const position = quantity / max
  const remainder = 1 - position

  return (
    <Wrapper>
      <Labels highlight={highlight}>
        <Column>
          <Label>
            {label}

            {sublabel ? <Sublabel>{sublabel}</Sublabel> : null}
          </Label>
        </Column>
        <Column flex="0 0 auto">
          <Quantity>{formatNumber(quantity)}</Quantity>
        </Column>
      </Labels>
      <BarWrapper>
        {position > 0 && (
          <Bar highlight={highlight} style={{ flexGrow: position }} />
        )}

        {remainder > 0 && <Filler style={{ flexGrow: remainder }} />}
      </BarWrapper>
    </Wrapper>
  )
}

HorizontalBarChart.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sublabel: PropTypes.string,
  quantity: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  highlight: PropTypes.bool,
}

HorizontalBarChart.defaultProps = {
  sublabel: null,
  highlight: false,
}

export default memo(HorizontalBarChart)
