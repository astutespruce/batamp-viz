import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Text } from 'theme-ui'

import { formatNumber } from 'util/format'

const VerticalBar = ({
  isFiltered,
  isExcluded,
  label,
  quantity,
  scale,
  valueType,
  showLabel,
  onClick,
}) => (
  <Box
    sx={{
      flex: '1 1 3rem',
      height: '100%',
      transition: 'opacity 300ms',
      opacity: isExcluded ? 0.25 : 1,
      '&:hover': {
        opacity: isExcluded ? 0.5 : 1,
      },
    }}
  >
    <Box
      sx={{
        cursor: 'pointer',
        height: '100%',
        position: 'relative',
        bottom: 0,
        borderBottom: '1px solid',
        borderBottomColor: 'grey.2',
        '&:hover': {
          '.bar': {
            opacity: 1,
          },
          '.tooltip,.tooltip-leader': {
            display: 'block',
          },
        },
      }}
      onClick={onClick}
    >
      <Box
        className="bar"
        sx={{
          bg: isFiltered ? 'highlight.5' : 'primary.4',
          borderStyle: 'solid',
          borderWidth: quantity > 0 ? '2px 1px 0 1px' : '0px',
          borderTopColor: isFiltered ? 'highlight.6' : 'primary.6',
          borderLeftColor: 'grey.2',
          borderRightColor: 'grey.2',
          opacity: 0.6,
          maxWidth: '40px',
          ml: 'auto',
          mr: 'auto',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
        style={{ height: `${scale(quantity)}%` }}
      />

      <Text
        className="tooltip"
        sx={{
          fontSize: '0.7rem',
          color: 'grey.8',
          position: 'absolute',
          textAlign: 'center',
          top: '-0.9rem',
          left: '-2rem',
          right: '-2rem',
          display: 'none',
        }}
      >
        {formatNumber(quantity)}
        {valueType === 'percent' ? '%' : ''}
      </Text>
      <Box
        className="tooltip-leader"
        sx={{
          width: '1px',
          height: 'calc(100% + 0.1rem)',
          bg: 'grey.9',
          display: 'none',
          position: 'absolute',
          bottom: 0,
          left: '50%',
          ml: '-1px',
        }}
      />
    </Box>

    {showLabel ? (
      <Text
        sx={{
          textAlign: 'center',
          color: isFiltered ? 'highlight.5' : 'grey.8',
          fontWeight: isFiltered ? 'bold' : 'normal',
          fontSize: '0.7rem',
          lineHeight: 1,
        }}
      >
        {label}
      </Text>
    ) : null}
  </Box>
)

VerticalBar.propTypes = {}

VerticalBar.propTypes = {
  isFiltered: PropTypes.bool, // true if filter is set on this bar
  isExcluded: PropTypes.bool, // true if filters are set on others but not this one
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  quantity: PropTypes.number.isRequired,
  scale: PropTypes.func.isRequired,
  valueType: PropTypes.string,
  showLabel: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
}

VerticalBar.defaultProps = {
  isFiltered: false,
  isExcluded: false,
  showLabel: true,
  valueType: 'count',
}

// TODO: optimize for changes to the callback
export default memo(VerticalBar)
