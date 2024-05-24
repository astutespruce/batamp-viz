import React from 'react'
import PropTypes from 'prop-types'

import { Box, Flex, Text } from 'theme-ui'

import { formatNumber } from 'util/format'

const BarChart = ({ title, subtitle, data, scale, highlight }) => {
  const max = Math.max(...data.map(({ value }) => value))
  const maxHeight = Math.max(scale(max), 32)

  return (
    <Box>
      <Text sx={{ color: highlight ? 'highlight.5' : 'grey.9', fontSize: 3 }}>
        {title}

        {subtitle ? (
          <Text
            sx={{
              display: 'inline',
              ml: '0.5em',
              fontSize: 2,
              color: highlight ? 'highlight.5' : 'grey.7',
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </Text>

      <Flex sx={{ flexWrap: 'no-wrap', justifyContent: 'space-evenly' }}>
        {data.map(({ label, value }) => (
          <Box key={label} sx={{ flex: '1 1 auto' }}>
            <Flex
              sx={{
                height: `${maxHeight}px`,
                flexDirection: 'column',
                justifyContent: 'flex-end',
                borderBottom: '1px solid',
                borderBottomColor: 'grey.2',
              }}
            >
              {value > 0 ? (
                <>
                  <Text
                    sx={{
                      fontSize: '0.6rem',
                      color: highlight ? 'highlight.5' : 'grey.8',
                      textAlign: 'center',
                      flex: '0 0 auto',
                    }}
                  >
                    {formatNumber(value)}
                  </Text>
                  <Box
                    sx={{
                      bg: highlight ? 'highlight.5' : 'primary.4',
                      borderTop: '2px solid',
                      borderTopColor: highlight ? 'highlight.6' : 'primary.6',
                      borderLeft: '1px solid',
                      borderLeftColor: 'grey.2',
                      borderRight: '1px solid',
                      borderRightColor: 'grey.2',
                    }}
                    style={{ flexBasis: scale(value) }}
                  />
                </>
              ) : (
                <Box sx={{ bg: 'primary.4' }} />
              )}
            </Flex>
            {label ? (
              <Text
                sx={{
                  fontSize: '0.6rem',
                  color: 'grey.6',
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            ) : null}
          </Box>
        ))}
      </Flex>
    </Box>
  )
}

BarChart.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      tooltip: PropTypes.string,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  scale: PropTypes.func.isRequired,
  highlight: PropTypes.bool,
}

BarChart.defaultProps = {
  subtitle: null,
  highlight: false,
}

export default BarChart
