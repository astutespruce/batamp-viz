import React from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Flex, Text } from 'theme-ui'
import { TimesCircle } from '@emotion-icons/fa-solid'

import { useCrossfilter } from 'components/Crossfilter'
import { formatNumber } from 'util/format'
import Filter from './Filter'
import { METRIC_LABELS } from '../../../config/constants'

const FiltersList = ({ filters }) => {
  const { resetFilters, state } = useCrossfilter()

  const handleReset = () => {
    resetFilters(new Set(filters.map(({ field }) => field)))
  }

  const { valueField, total, filteredTotal, hasVisibleFilters } = state

  const metricLabel = METRIC_LABELS[valueField]

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        flex: '1 1 auto',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          flex: '0 0 auto',
          px: '1rem',
          pb: '0.5rem',
          borderBottom: '1px solid',
          borderBottomColor: 'grey.2',
        }}
      >
        <Text sx={{ mt: '1rem', color: 'grey.9', lineHeight: 1.2 }}>
          <b>{formatNumber(filteredTotal, 0)}</b>{' '}
          {filteredTotal < total ? `of ${formatNumber(total, 0)}` : ''}{' '}
          {metricLabel} are visible within the map.
        </Text>
      </Box>

      <Box
        sx={{ flex: '1 1 auto', pr: '1rem', overflowY: 'auto', height: '100%' }}
      >
        {filters.map((filter) => (
          <Filter key={filter.field} {...filter} />
        ))}
      </Box>

      {hasVisibleFilters && (
        <Flex
          sx={{
            justifyContent: 'center',
            py: '0.5rem',
            flex: '0 0 auto',
            bg: 'grey.1',
            borderTop: '2px solid',
            borderTopColor: 'grey.4',
          }}
        >
          <Button
            sx={{
              fontSize: 1,
              py: '0.25rem',
              px: '0.5rem',
              bg: 'highlight.5',
              cursor: 'pointer',
            }}
            onClick={handleReset}
          >
            <Flex sx={{ alignItems: 'center', gap: '0.25rem' }}>
              <TimesCircle size="1em" />
              <div>reset all filters</div>
            </Flex>
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

FiltersList.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      filterFunc: PropTypes.func,
      title: PropTypes.string.isRequired,
      values: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ),
      labels: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ),
      vertical: PropTypes.bool,
    })
  ).isRequired,
}

export default FiltersList
