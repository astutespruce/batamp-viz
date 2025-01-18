import React, { useState, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Text } from 'theme-ui'

// import { METRIC_LABELS } from 'config'
import { formatNumber, quantityLabel } from 'util/format'

const DetectorsList = ({ displayField, detectors, map }) => {
  const [highlightedId, setHighlightedId] = useState(null)

  const handleZoomTo = (id, lon, lat) => {
    setHighlightedId(() => id)
    map.flyTo({ center: [lon, lat], zoom: 17 })
  }

  // clear highlight on mount
  useLayoutEffect(() => {
    setHighlightedId(null)
  }, [detectors])

  // TODO: bring in stats for selected species

  //   const metricLabel = METRIC_LABELS[displayField]

  return (
    <Box>
      {Object.entries(detectors).map(([source, sourceDetectors]) => (
        <Box
          key={source}
          sx={{
            '&:not(:first-of-type)': {
              mt: '2rem',
            },
          }}
        >
          <Box sx={{ fontSize: 3, fontWeight: 'bold', mb: '0.5rem' }}>
            From{' '}
            {source === 'nabat'
              ? 'North American Bat Monitoring Program (NABat)'
              : 'Bat Acoustic Monitoring Portal (BatAMP)'}
            :
          </Box>
          <Box>
            {sourceDetectors.map(
              ({
                id: detId,
                siteName,
                detectorNights: detDetectorNights,
                dateRange,
                lon,
                lat,
              }) => (
                <Box
                  key={detId}
                  sx={{
                    pl: '0.5rem',
                    pb: '0.5rem',
                    borderLeft: '0.25rem solid',
                    borderLeftColor: 'transparent',
                    borderBottom: '1px solid transparent',
                    ...(detId === highlightedId
                      ? {
                          borderLeftColor: 'highlight.5',
                        }
                      : {}),
                    '&:not(:first-of-type)': {
                      pt: '0.5rem',
                      borderTop: '1px solid',
                      borderTopColor: 'grey.3',
                    },
                  }}
                >
                  <Flex
                    sx={{
                      gap: '1rem',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text>{siteName.split(',').join(', ')}</Text>
                    <Text
                      onClick={() => {
                        handleZoomTo(detId, lon, lat)
                      }}
                      sx={{
                        flex: '0 0 auto',
                        fontSize: 1,
                        color: 'link',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      zoom to
                    </Text>
                  </Flex>
                  <Flex
                    sx={{
                      gap: '0.5rem',
                      fontSize: 1,
                      color: 'grey.8',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text>{dateRange}</Text>
                    <Text>
                      {formatNumber(detDetectorNights, 0)}{' '}
                      {quantityLabel('nights', detDetectorNights)} monitored{' '}
                    </Text>
                  </Flex>
                </Box>
              )
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

DetectorsList.propTypes = {
  displayField: PropTypes.string.isRequired,
  detectors: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
}

export default DetectorsList
