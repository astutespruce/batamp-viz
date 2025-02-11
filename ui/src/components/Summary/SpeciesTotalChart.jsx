import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Flex, Text } from 'theme-ui'
import { formatNumber } from 'util/format'

const SpeciesTotalChart = ({
  commonName,
  sciName,
  total,
  max,
  highlight,
  note,
}) => {
  const position = total / max
  const remainder = 1 - position

  return (
    <Box sx={{ lineHeight: 1, mb: '1rem' }}>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Box
          sx={{ flex: '1 1 auto', color: highlight ? 'highlight.5' : 'grey.9' }}
        >
          {commonName}
          <Text
            sx={{
              display: 'inline',
              ml: '0.5em',
              color: 'grey.8',
              fontSize: 1,
            }}
          >
            ({sciName})
          </Text>
        </Box>
        <Box
          sx={{
            flex: '0 0 auto',
            color: highlight ? 'highlight.5' : 'grey.8',
            fontSize: 1,
          }}
        >
          {formatNumber(total)}
        </Box>
      </Flex>
      <Flex
        sx={{
          flexWrap: 'nowrap',
          height: '1rem',
          bg: 'grey.2',
          border: '1px solid',
          borderColor: 'grey.2',
          my: '0.1rem',
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
      {note ? (
        <Box sx={{ fontSize: 0, color: 'grey.8', mb: '1.25rem' }}>{note}</Box>
      ) : null}
    </Box>
  )
}

SpeciesTotalChart.propTypes = {
  commonName: PropTypes.string.isRequired,
  sciName: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  highlight: PropTypes.bool,
  note: PropTypes.string,
}

SpeciesTotalChart.defaultProps = {
  highlight: false,
  note: null,
}

export default memo(SpeciesTotalChart)
