import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex } from 'theme-ui'

const Circle = ({
  label,
  radius,
  color,
  borderColor,
  borderWidth,
  scale,
  ...props
}) => {
  const width = 2 * borderWidth + 2 * radius * scale
  const center = width / 2

  return (
    <Flex
      sx={{
        alignItems: 'center',
      }}
      {...props}
    >
      <Flex
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '24px',
          textAlign: 'center',
        }}
      >
        <svg style={{ width, height: width, ...props }}>
          <circle
            cx={center}
            cy={center}
            r={radius * scale}
            fill={color}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      </Flex>
      <Box
        sx={{ fontSize: 1, color: 'grey.8', ml: '0.25rem', lineHeight: 1.2 }}
      >
        {label}
      </Box>
    </Flex>
  )
}

Circle.propTypes = {
  label: PropTypes.string.isRequired,
  radius: PropTypes.number.isRequired,
  color: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  scale: PropTypes.number,
}

Circle.defaultProps = {
  borderWidth: 0,
  color: null,
  borderColor: 'transparent',
  scale: 1,
}

export default Circle
