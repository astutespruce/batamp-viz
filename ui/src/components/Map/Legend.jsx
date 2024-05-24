import React, { useState, memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Flex, Text } from 'theme-ui'

const Circle = ({ radius, color, borderColor, borderWidth, scale }) => {
  const width = 2 * borderWidth + 2 * radius * scale
  const center = width / 2

  return (
    <svg style={{ width, height: width }}>
      <circle
        cx={center}
        cy={center}
        r={radius * scale}
        fill={color}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
    </svg>
  )
}

Circle.propTypes = {
  radius: PropTypes.number.isRequired,
  color: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  scale: PropTypes.number,
}

Circle.defaultProps = {
  borderWidth: 0,
  color: null,
  borderColor: null,
  scale: 1,
}

const Legend = ({ title, entries, note }) => {
  const [isClosed, setIsClosed] = useState(false)
  const toggle = () => setIsClosed((prevIsClosed) => !prevIsClosed)

  return (
    <Box
      sx={{
        cursor: 'pointer',
        position: 'absolute',
        maxWidth: '200px',
        right: '10px',
        bottom: '24px',
        zIndex: 10000,
        bg: '#FFF',
        borderRadius: '0.5rem',
        border: '1px solid',
        borderColor: 'grey.4',
        boxShadow: '1px 1px 4px #666',
        p: '0.25rem 0.5rem 0.5rem',
      }}
      onClick={toggle}
    >
      {isClosed ? (
        <Text sx={{ fontSize: ['0.8rem', '0.8rem', '1rem'], lineHeight: 1.2 }}>
          Legend
        </Text>
      ) : (
        <div>
          {title ? (
            <Text
              sx={{
                fontSize: 2,
                fontWeight: 'bold',
                lineHeight: 1.2,
                mb: '0.5rem',
              }}
            >
              {title}
            </Text>
          ) : null}

          {entries.map(
            ({
              type,
              label,
              radius,
              color = 'transparent',
              borderWidth = 0,
              borderColor = 'transparent',
            }) => (
              <Flex
                sx={{
                  alignItems: 'center',
                  '&:not(:first-of-type)': {
                    mt: '0.25rem',
                  },
                }}
                key={label}
              >
                {type === 'circle' ? (
                  <Flex
                    sx={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '36px',
                      textAlign: 'center',
                    }}
                  >
                    <Circle
                      radius={radius}
                      scale={1}
                      color={color}
                      borderColor={borderColor}
                      borderWidth={borderWidth}
                    />
                  </Flex>
                ) : (
                  <Box
                    sx={{
                      flex: '0 0 1.25rem',
                      width: '1.25rem',
                      height: '1.25rem',
                      bg: color,
                      borderStyle: 'solid',
                      borderWidth: `${borderWidth}px`,
                      borderColor,
                      borderRadius: '0.25rem',
                    }}
                  />
                )}
                <Box sx={{ fontSize: 1, color: 'grey.8', ml: '0.5rem' }}>
                  {label}
                </Box>
              </Flex>
            )
          )}

          {note ? (
            <Text
              sx={{
                fontSize: 0,
                color: 'grey.6',
                lineHeight: 1.1,
                mt: '0.5rem',
              }}
            >
              {note}
            </Text>
          ) : null}
        </div>
      )}
    </Box>
  )
}

Legend.propTypes = {
  title: PropTypes.string,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string,
      borderColor: PropTypes.string,
      borderWidth: PropTypes.number,
      radius: PropTypes.number,
    })
  ),
  note: PropTypes.string,
}

Legend.defaultProps = {
  title: null,
  entries: [],
  note: null,
}

export default memo(Legend)
