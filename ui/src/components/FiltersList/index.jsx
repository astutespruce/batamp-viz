import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { FaRegTimesCircle } from 'react-icons/fa'
import { Text } from 'rebass'

import { useCrossfilter } from 'components/Crossfilter'
import { Button } from 'components/Button'
import { Flex, Box } from 'components/Grid'
import { formatNumber } from 'util/format'
import styled, { themeGet } from 'style'
import Filter from './Filter'
import { METRIC_LABELS } from '../../../config/constants'

const Wrapper = styled(Flex).attrs({
  flexDirection: 'column',
  flex: 1,
})`
  height: 100%;
`

const Header = styled(Box).attrs({
  flex: 0,
  px: '1rem',
  pb: '0.5rem',
})`
  border-bottom: 1px solid ${themeGet('colors.grey.200')};
`

const Count = styled(Text).attrs({ fontSize: '0.9em' })`
  color: ${themeGet('colors.grey.900')};
  line-height: 1.2;
`

const ResetContainer = styled(Flex).attrs({
  justifyContent: 'center',
  py: '0.5rem',
})`
  flex: 0;
  background: ${themeGet('colors.grey.100')};
  border-top: 1px solid ${themeGet('colors.grey.200')};
`

const ResetButton = styled(Button).attrs({ secondary: true })`
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  padding: 0.1rem 0.5rem;

  background: ${themeGet('colors.highlight.500')};
`

const ResetIcon = styled(FaRegTimesCircle).attrs({
  size: '1em',
})`
  height: 1em;
  width: 1em;
  margin-right: 0.25rem;
  cursor: pointer;
`

const Filters = styled(Box).attrs({ flex: 1, pr: '1rem' })`
  overflow-y: auto;
  flex: 1;
  height: 100%;
`

const FiltersList = ({ filters }) => {
  const { resetFilters, state } = useCrossfilter()

  const hasFilters =
    filters.filter(({ field }) => {
      const curFilter = state.get('filters').get(field)
      return curFilter && !curFilter.isEmpty()
    }).length > 0

  const handleReset = () => {
    resetFilters(filters.map(({ field }) => field))
  }

  const metricLabel = METRIC_LABELS[state.get('valueField')]

  const filteredTotal = state.get('filteredTotal')
  const total = state.get('total')

  return (
    <Wrapper>
      <Header>
        <Count>
          <b>{formatNumber(filteredTotal, 0)}</b>{' '}
          {filteredTotal < total ? `of ${formatNumber(total, 0)}` : ''}{' '}
          {metricLabel} are visible within the map.
        </Count>
      </Header>

      <Filters>
        {filters.map(filter => (
          <Filter key={filter.field} {...filter} />
        ))}
      </Filters>

      {hasFilters && (
        <ResetContainer>
          <ResetButton onClick={handleReset}>
            <ResetIcon />
            <div>reset all filters</div>
          </ResetButton>
        </ResetContainer>
      )}
    </Wrapper>
  )
}

FiltersList.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      filterFunc: PropTypes.func.isRequired,
      title: PropTypes.string.isRequired,
      values: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ),
      labels: PropTypes.arrayOf(PropTypes.string),
      vertical: PropTypes.bool,
    })
  ).isRequired,
}

export default FiltersList
