import React from 'react'
import PropTypes from 'prop-types'

import { Box, Flex, Text } from 'theme-ui'

import { formatNumber } from 'util/format'

const SpeciesMonthlyChart = ({
  commonName,
  sciName,
  note,
  months,
  scale,
  highlight,
  valueType,
}) => (
  <Box sx={{ pr: '1rem' }}>
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

    <Flex
      sx={{
        flexWrap: 'nowrap',
        mt: '1rem',
        position: 'relative',
        height: '100px',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: '0 0 auto',
          lineHeight: 1,
          fontSize: '0.6rem',
          textAlign: 'right',
          width: scale.domain()[1] >= 1000 ? '3em' : '1.5rem',
        }}
      >
        {scale.ticks(4).map((d) => (
          <Box
            key={d}
            sx={{
              lineHeight: 1,
              position: 'absolute',
              right: '4px',
              bottom: `calc(${scale(d)}px - 0.25rem)`,
            }}
          >
            {formatNumber(d)}
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          zIndex: 0,
          ml: '2px',
          top: 0,
          height: '100px',
          right: 0,
          left: scale.domain()[1] >= 1000 ? '2rem' : '1.4rem',
        }}
      >
        {scale.ticks(4).map((d) => (
          <Box
            key={d}
            sx={{
              position: 'absolute',
              bottom: `${scale(d)}px`,
              left: 0,
              right: 0,
              borderBottom: '1px dotted',
              borderBottomColor: 'grey.2',
            }}
          />
        ))}
      </Box>

      <Flex
        sx={{
          flex: '1 1 auto',
          flexWrap: 'no-wrap',
          justifyContent: 'space-evenly',
          borderLeft: '1px solid',
          borderLeftColor: 'grey.2',
          borderRight: '1px solid',
          borderRightColor: 'grey.2',
        }}
      >
        {months.map(({ label, total }) => (
          <Box key={label} sx={{ flex: '1 1 auto' }}>
            <Box
              sx={{
                position: 'relative',
                height: '100px',
                borderBottom: '1px solid',
                borderBottomColor: 'grey.2',
                cursor: 'pointer',
                '&:hover': {
                  '.bar': {
                    opacity: 1,
                  },
                  '.tooltip,.tooltip-leader': {
                    display: 'block',
                  },
                },
              }}
            >
              {total !== null && total >= 0 ? (
                <>
                  <Box
                    className="bar"
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      bg: highlight ? 'highlight.5' : 'primary.4',
                      opacity: 0.7,
                      borderTop: '2px solid',
                      borderTopColor: highlight ? 'highlight.6' : 'primary.6',
                      borderLeft: '1px solid',
                      borderLeftColor: 'grey.2',
                      borderRight: '1px solid',
                      borderRightColor: 'grey.2',
                      height: `${scale(total)}px`,
                      bottom: 0,
                    }}
                  />
                </>
              ) : (
                <Box sx={{ bg: 'primary.4' }} />
              )}

              <Text
                className="tooltip"
                sx={{
                  bg: 'rgba(255,255,255, 0.8)',
                  fontSize: '0.7rem',
                  color: 'grey.8',
                  position: 'absolute',
                  textAlign: 'center',
                  top: '-0.9rem',
                  lineHeight: 1,
                  left: '-2rem',
                  right: '-2rem',
                  display: 'none',
                }}
              >
                {total === null
                  ? 'not reported'
                  : `${formatNumber(total)}${valueType === 'percent' ? '%' : ''}`}
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

            {label ? (
              <Text
                sx={{
                  position: 'absolute',
                  bottom: '-0.75rem',
                  fontSize: '0.6rem',
                  lineHeight: 1,
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
    </Flex>
  </Box>
)

SpeciesMonthlyChart.propTypes = {
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
  valueType: PropTypes.string,
}

SpeciesMonthlyChart.defaultProps = {
  note: null,
  highlight: false,
  valueType: 'count',
}

export default SpeciesMonthlyChart
