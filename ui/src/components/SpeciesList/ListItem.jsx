import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Grid, Text } from 'theme-ui'
import { GatsbyImage } from 'gatsby-plugin-image'

import { OutboundLink, Link } from 'components/Link'
import { SPECIES } from 'config'
import { formatNumber, quantityLabel } from 'util/format'

const ListItem = ({
  item: {
    speciesID,
    commonName,
    sciName,
    detectors,
    presenceOnlyDetectors,
    detections,
    presenceOnlyDetections,
    detectionNights,
    detectorNights,
    presenceOnlyDetectorNights,
    contributors,
  },
  metric,
  thumbnail,
  map,
}) => {
  const { imageCredits } = SPECIES[speciesID]

  return (
    <Box
      sx={{
        mt: '1rem',
        ':not(:first-of-type)': {
          borderTop: '1px solid',
          borderTopColor: 'grey.2',
          pt: '1rem',
          mt: '2rem',
        },
      }}
    >
      <Box sx={{ ml: '1rem', fontSize: '1.75rem' }}>
        <Link to={`/species/${speciesID}`}>
          {commonName}{' '}
          <Text sx={{ display: 'inline', fontSize: '1.25rem' }}>
            ({sciName})
          </Text>
        </Link>
      </Box>

      <Grid
        columns={[0, '208px 1fr 160px']}
        sx={{
          flexWrap: ['wrap', 'nowrap', 'nowrap'],
          justifyContent: 'space-between',
          gap: '1rem',
          mt: '0.5rem',
          px: '1rem',
          lineHeight: 1.4,
        }}
      >
        <Box sx={{ flex: '0 1 auto' }}>
          {thumbnail ? (
            <>
              <GatsbyImage
                image={thumbnail}
                alt={`species photo for ${commonName} (${sciName})`}
              />
              <Box
                sx={{
                  mt: '0.25rem',
                  fontSize: 0,
                  color: 'grey.6',
                  lineHeight: 1.2,
                }}
              >
                credit:{' '}
                {imageCredits || (
                  <>
                    <OutboundLink to="https://www.merlintuttle.org">
                      MerlinTuttle.org
                    </OutboundLink>{' '}
                    |{' '}
                    <OutboundLink to="http://www.batcon.org/">
                      batcon.org
                    </OutboundLink>
                  </>
                )}
              </Box>
            </>
          ) : (
            <Flex
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 0,
                color: 'grey.6',
                bg: 'grey.2',
                height: '100%',
                minHeight: '4rem',
              }}
            >
              no photo available
            </Flex>
          )}
        </Box>

        <Box
          as="ul"
          sx={{
            fontSize: [2, 2, 3],
            mt: '0.5rem',
            pl: 0,
            listStyle: 'none',
            '& li': { mb: '0.25rem' },
            '& li+li': {
              mt: '0.75rem',
            },
          }}
        >
          <li>
            {detectionNights > 0 ? (
              <>
                detected on{' '}
                <Text
                  sx={{
                    display: 'inline',
                    fontWeight:
                      metric === 'nights detected' ? 'bold' : 'normal',
                    color:
                      metric === 'nights detected' ? 'highlight.5' : 'inherit',
                  }}
                >
                  {formatNumber(detectionNights, 0)}
                </Text>{' '}
              </>
            ) : (
              'not detected on any '
            )}
            of {formatNumber(detectorNights, 0)} nights monitored
          </li>

          {detections > 0 ? (
            <li>
              <Text
                sx={{
                  display: 'inline',
                  fontWeight: metric === 'detections' ? 'bold' : 'normal',
                  color: metric === 'detections' ? 'highlight.5' : 'inherit',
                }}
              >
                {formatNumber(detections, 0)}
              </Text>{' '}
              total detections
            </li>
          ) : null}

          <li>
            <Text
              sx={{
                display: 'inline',
                fontWeight: metric === 'detectors' ? 'bold' : 'normal',
                color: metric === 'detectors' ? 'highlight.5' : 'inherit',
              }}
            >
              {formatNumber(detectors, 0)}
            </Text>{' '}
            detectors monitored by{' '}
            <Text
              sx={{
                display: 'inline',
                fontWeight: metric === 'contributors' ? 'bold' : 'normal',
                color: metric === 'contributors' ? 'highlight.5' : 'inherit',
              }}
            >
              {contributors}
            </Text>{' '}
            {quantityLabel('contributors', contributors)}
          </li>

          {!!presenceOnlyDetectors && (
            <li>
              <Text variant="help" sx={{ fontSize: 1 }}>
                Note: {formatNumber(presenceOnlyDetections, 0)} detections on
                the {formatNumber(presenceOnlyDetectorNights, 0)} nights
                monitored at {formatNumber(presenceOnlyDetectors, 0)} detectors
                only recorded species presence, not activity.
              </Text>
            </li>
          )}
        </Box>

        <Box>
          <GatsbyImage
            image={map}
            alt={`distribution map thumnbnail for ${commonName} (${sciName})`}
          />
          <Box
            sx={{
              fontSize: 0,
              color: 'grey.6',
              lineHeight: 1.2,
              textAlign: 'right',
            }}
          >
            range:{' '}
            <OutboundLink to="http://www.batcon.org/">batcon.org</OutboundLink>{' '}
            | <OutboundLink to="http://www.iucnredlist.org/">IUCN</OutboundLink>
            <br />
            basemap: © Mapbox, © OpenStreetMap
          </Box>
        </Box>
      </Grid>
    </Box>
  )
}

ListItem.propTypes = {
  item: PropTypes.shape({
    speciesID: PropTypes.string.isRequired,
    commonName: PropTypes.string.isRequired,
    sciName: PropTypes.string.isRequired,
    detectors: PropTypes.number.isRequired,
    presenceOnlyDetectors: PropTypes.number,
    detections: PropTypes.number.isRequired,
    presenceOnlyDetections: PropTypes.number,
    detectionNights: PropTypes.number.isRequired,
    detectorNights: PropTypes.number.isRequired,
    presenceOnlyDetectorNights: PropTypes.number,
    contributors: PropTypes.number.isRequired,
  }).isRequired,
  metric: PropTypes.string.isRequired,
  thumbnail: PropTypes.object,
  map: PropTypes.object,
}

ListItem.defaultProps = {
  thumbnail: null,
  map: null,
}

// only rerender on item or metric change
export default memo(
  ListItem,
  (
    { item: { speciesID: prevSpecies }, metric: prevMetric },
    { item: { speciesID: nextSpecies }, metric: nextMetric }
  ) => prevSpecies === nextSpecies && prevMetric === nextMetric
)
