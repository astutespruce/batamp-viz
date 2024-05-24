import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Flex } from 'theme-ui'
import { formatNumber } from 'util/format'

const HorizontalBarChart = ({ label, quantity, max, highlight }) => {
  const position = quantity / max
  const remainder = 1 - position

  return (
    <Box sx={{ lineHeight: 1, mb: '1rem' }}>
      <Flex sx={{ justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <Box
          sx={{ flex: '1 1 auto', color: highlight ? 'highlight.5' : 'grey.9' }}
        >
          {label}
        </Box>
        <Box
          sx={{ flex: '0 0 auto', color: highlight ? 'highlight.5' : 'grey.7' }}
        >
          {formatNumber(quantity)}
        </Box>
      </Flex>
      <Flex
        sx={{
          flexWrap: 'nowrap',
          height: '1rem',
          bg: 'grey.2',
          border: '1px solid',
          borderColor: 'grey.2',
        }}
      >
        {position > 0 && (
          <Box
            sx={{
              bg: highlight ? 'highlight.5' : 'primary.5',
              transition: 'flex-grow 300ms',
            }}
            style={{ flexGrow: position }}
          />
        )}

        {remainder > 0 && (
          <Box
            sx={{ transition: 'flex-grow 300ms' }}
            style={{ flexGrow: remainder }}
          />
        )}
      </Flex>
    </Box>
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
