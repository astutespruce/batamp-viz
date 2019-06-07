import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Flex, Columns, Column } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'

const Wrapper = styled.div`
  line-height: 1;
  margin-bottom: 0.75rem;
`

const Labels = styled(Columns).attrs({
  justifyContent: 'space-between',
})`
  color: ${({ highlight }) =>
    highlight ? themeGet('colors.highlight.500') : themeGet('colors.grey.700')};
  font-size: 0.8rem;
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

const HorizontalBarChart = ({ label, quantity, max, highlight }) => {
  const position = quantity / max
  const remainder = 1 - position

  return (
    <Wrapper>
      <Labels highlight={highlight}>
        <Column>{label}</Column>
        <Column flex={0}>{formatNumber(quantity)}</Column>
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
  quantity: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  highlight: PropTypes.bool,
}

HorizontalBarChart.defaultProps = {
  highlight: false,
}

export default memo(HorizontalBarChart)
