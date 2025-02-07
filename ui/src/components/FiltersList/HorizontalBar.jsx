import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex } from 'theme-ui'

import { formatNumber } from 'util/format'

const HorizontalBar = ({
  value,
  isFiltered,
  isExcluded,
  label,
  quantity,
  max,
  showCount,
  valueType,
  onClick,
}) => {
  const position = quantity / max
  const remainder = 1 - position

  const handleClick = () => {
    onClick(value)
  }

  return (
    <Box
      sx={{
        cursor: 'pointer',
        lineHeight: 1,
        mb: '1rem',
        transition: 'opacity 300ms',
        opacity: isExcluded ? 0.25 : 1,
        '&:hover': {
          opacity: isExcluded ? 0.5 : 1,
        },
      }}
      onClick={handleClick}
    >
      <Flex
        sx={{
          justifyContent: 'space-between',
          color: isFiltered ? 'highlight.5' : 'grey.8',
        }}
      >
        <Box sx={{ flex: '1 1 auto', fontSize: 2 }}>{label}</Box>
        {showCount && (
          <Box sx={{ flex: '0 0 auto', fontSize: 1 }}>
            {formatNumber(quantity)}
            {valueType === 'percent' ? '%' : ''}
          </Box>
        )}
      </Flex>
      <Flex
        sx={{
          mt: '0.1rem',
          flexWrap: 'nowrap',
          height: '0.5rem',
          borderRadius: '0.25rem',
          bg: 'grey.2',
          border: '1px solid',
          borderColor: 'grey.2',
          overflow: 'hidden',
        }}
      >
        {position > 0 ? (
          <Box
            sx={{
              bg: isFiltered ? 'highlight.5' : 'primary.5',
              transition: 'flex-grow 300ms',
            }}
            style={{ flexGrow: position }}
          />
        ) : null}

        {remainder > 0 ? (
          <Box
            sx={{ transition: 'flex-grow 300ms' }}
            style={{ flexGrow: remainder }}
          />
        ) : null}
      </Flex>
    </Box>
  )
}

HorizontalBar.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isFiltered: PropTypes.bool, // true if filter is set on this bar
  isExcluded: PropTypes.bool, // true if filters are set on others but not this one
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  quantity: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  showCount: PropTypes.bool,
  valueType: PropTypes.string,
  onClick: PropTypes.func.isRequired,
}

HorizontalBar.defaultProps = {
  isFiltered: false,
  isExcluded: false,
  showCount: true,
  valueType: 'count',
}

// TODO: optimize for changes to the callback
export default memo(HorizontalBar)
