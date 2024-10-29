import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Text } from 'theme-ui'

import { Donut } from 'components/Chart'
import { formatNumber } from 'util/format'

const activeLabelCSS = {
  fontWeight: 'bold',
  color: 'grey.8',
}

const donutLabels = {
  sppDetections: 'detections',
  detectorNights: 'nights',
}

const Contributor = ({
  contributor,
  sppDetections,
  detectorNights,
  detectors,
  species,
  percent,
  metric,
}) => (
  <Box
    sx={{
      p: '1rem',
      flex: '0 0 auto',
      borderRadius: '0.25rem',
      bg: 'grey.1',
      width: '310px',
    }}
  >
    <Box
      sx={{
        fontSize: 3,
        pb: '0.25rem',
        mb: '0.75rem',
        borderBottom: '1px solid',
        borderBottomColor: 'grey.4',
      }}
    >
      {contributor}
    </Box>

    <Flex sx={{ justifyContent: 'space-between' }}>
      <Box sx={{ flex: '1 1 auto', fontSize: 2 }}>
        <Box sx={{ color: 'grey.7', lineHeight: 1.4 }}>
          <Text
            sx={{
              display: 'inline',
              ...(metric === 'sppDetections' ? activeLabelCSS : {}),
            }}
          >
            {formatNumber(sppDetections, 0)} detections
          </Text>
          <br />
          on{' '}
          <Text
            sx={{
              display: 'inline',
              ...(metric === 'detectorNights' ? activeLabelCSS : {}),
            }}
          >
            {formatNumber(detectorNights, 0)} nights
          </Text>
          <br />
          using{' '}
          <Text
            sx={{
              display: 'inline',
              ...(metric === 'detectors' ? activeLabelCSS : {}),
            }}
          >
            {formatNumber(detectors, 0)} detectors
          </Text>
          .
          <br />
          <br />
          <Text
            sx={{
              display: 'inline',
              ...(metric === 'species' ? activeLabelCSS : {}),
            }}
          >
            {species} species
          </Text>{' '}
          detected.
        </Box>
      </Box>
      <Box sx={{ flex: '0 0 auto' }}>
        <Donut
          size={100}
          percentSize={24}
          donutWidth={18}
          label={`of ${donutLabels[metric] || metric}`}
          percent={percent}
        />
      </Box>
    </Flex>
  </Box>
)

Contributor.propTypes = {
  contributor: PropTypes.string.isRequired,
  detectorNights: PropTypes.number.isRequired,
  sppDetections: PropTypes.number.isRequired,
  detectors: PropTypes.number.isRequired,
  species: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired,
  metric: PropTypes.string.isRequired,
}

export default Contributor
