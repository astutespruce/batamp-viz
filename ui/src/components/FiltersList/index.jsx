import React from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Flex, Heading, Text } from 'theme-ui'
import { TimesCircle } from '@emotion-icons/fa-solid'

import { SPECIES } from 'config'
import { useCrossfilter } from 'components/Crossfilter'
import { formatNumber } from 'util/format'
import Filter from './Filter'

const FiltersList = ({ filters, speciesID }) => {
  const {
    resetFilters,
    state: {
      hasFilters,
      metric: { field, label: metricLabel, total },
      total: filteredTotal,
    },
  } = useCrossfilter()

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        flex: '1 1 auto',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* <Box
        sx={{
          flex: '0 0 auto',
          px: '1rem',
          pb: '0.5rem',
          borderBottom: '1px solid',
          borderBottomColor: 'grey.2',
        }}
      >
        {field === 'detectionRate' ? (
          <Text sx={{ mt: '1rem', color: 'grey.9', lineHeight: 1.2 }}>
            <b>
              Percent of nights that detected {SPECIES[speciesID].commonName}s:
            </b>
          </Text>
        ) : (
          <Text sx={{ mt: '1rem', color: 'grey.9', lineHeight: 1.2 }}>
            <b>{formatNumber(filteredTotal, 0)}</b>{' '}
            {filteredTotal < total ? `of ${formatNumber(total, 0)}` : ''}{' '}
            {metricLabel} are visible within the map.
          </Text>
        )}
      </Box> */}

      <Heading
        as="h3"
        sx={{
          py: '0.25rem',
          px: '1rem',
          textAlign: 'center',
          bg: 'grey.2',
          mb: '0.5rem',
          textTransform: 'capitalize',
        }}
      >
        {field === 'speciesDetected'
          ? 'Number of Species Detected'
          : metricLabel}
      </Heading>

      <Box
        sx={{ flex: '1 1 auto', pr: '1rem', overflowY: 'auto', height: '100%' }}
      >
        {filters.map((filter) => (
          <Filter key={filter.field} {...filter} />
        ))}
      </Box>

      {hasFilters && (
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
            onClick={resetFilters}
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
  speciesID: PropTypes.string,
}

FiltersList.defaultProps = {
  speciesID: null,
}

export default FiltersList
