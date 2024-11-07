import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Text } from 'theme-ui'

const Patch = ({
  type,
  color,
  label,
  height,
  borderWidth,
  borderColor,
  borderRadius,
  opacity,
  ...props
}) => {
  if (type === 'gradient') {
    return (
      <Flex {...props}>
        <Box
          sx={{
            flex: '0 0 1.25rem',
            width: '1.25rem',
            height,
            background: color,
            borderStyle: 'solid',
            borderWidth: `${borderWidth}px`,
            borderColor,
            borderRadius: '0.25rem',
            opacity,
          }}
        />
        <Flex
          sx={{
            flex: '1 1 auto',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: 1,
            color: 'grey.8',
            ml: '0.5rem',
          }}
        >
          {label.map((entry) => (
            <Text key={entry}>{entry}</Text>
          ))}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex
      sx={{
        alignItems: 'center',
      }}
      {...props}
    >
      <Box
        sx={{
          flex: '0 0 1.25rem',
          width: '1.25rem',
          height: '1.25rem',
          bg: color,
          borderStyle: 'solid',
          borderWidth: `${borderWidth}px`,
          borderColor,
          borderRadius,
          opacity,
        }}
      />
      <Box sx={{ fontSize: 1, color: 'grey.8', ml: '0.5rem' }}>{label}</Box>
    </Flex>
  )
}

Patch.propTypes = {
  type: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]).isRequired,
  color: PropTypes.string,
  height: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  borderRadius: PropTypes.string,
  opacity: PropTypes.number,
}

Patch.defaultProps = {
  color: 'transparent',
  height: '1.25rem',
  borderColor: 'transparent',
  borderWidth: 0,
  borderRadius: '0.25rem',
  opacity: 1,
}

export default Patch
