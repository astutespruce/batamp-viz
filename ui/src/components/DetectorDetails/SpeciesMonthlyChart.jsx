import React from 'react'
import PropTypes from 'prop-types'

import { Box, Flex, Text } from 'theme-ui'

import { formatNumber } from 'util/format'

const BarChart = ({ commonName, sciName, note, months, scale, highlight }) => {
  const max = Math.max(...months.map(({ total }) => total))
  const maxHeight = Math.max(scale(max), 32)

  return (
    <Box>
      <Text sx={{ color: highlight ? 'highlight.5' : 'grey.9', fontSize: 2 }}>
        {commonName}
        <Text
          sx={{
            display: 'inline',
            ml: '0.5em',
            fontSize: 1,
            color: highlight ? 'highlight.5' : 'grey.8',
          }}
        >
          ({sciName})
        </Text>
      </Text>
      {note ? <Text sx={{ fontSize: 1, color: 'grey.8' }}>{note}</Text> : null}
      <Flex sx={{ flexWrap: 'no-wrap', justifyContent: 'space-evenly' }}>
        {months.map(({ label, total }) => (
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
              {total !== null && total >= 0 ? (
                <>
                  <Text
                    sx={{
                      fontSize: '0.6rem',
                      color: highlight ? 'highlight.5' : 'grey.8',
                      textAlign: 'center',
                      flex: '0 0 auto',
                    }}
                  >
                    {formatNumber(total)}
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
                    style={{ flexBasis: scale(total) }}
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
                  color: 'grey.8',
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
  commonName: PropTypes.string.isRequired,
  sciName: PropTypes.string.isRequired,
  note: PropTypes.string,
  months: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      tooltip: PropTypes.string,
      total: PropTypes.number,
    })
  ).isRequired,
  scale: PropTypes.func.isRequired,
  highlight: PropTypes.bool,
}

BarChart.defaultProps = {
  note: null,
  highlight: false,
}

export default BarChart
