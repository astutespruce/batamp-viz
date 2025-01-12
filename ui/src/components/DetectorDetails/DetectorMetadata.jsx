import React from 'react'
import PropTypes from 'prop-types'
import {
  Check,
  Times,
  ExclamationTriangle,
  ExternalLinkAlt,
} from '@emotion-icons/fa-solid'
import { Box, Text } from 'theme-ui'

import { OutboundLink } from 'components/Link'
import { SPECIES } from 'config'
import { formatNumber, quantityLabel } from 'util/format'
import Field from './Field'

const DetectorMetadata = ({
  displayField,
  source,
  dataset,
  countType,
  lat,
  lon,
  micHt,
  detType,
  micType,
  reflType,
  callId,
  organization,
  contributors,
  detectorNights,
  detectionNights,
  speciesTotals,
  speciesID,
}) => {
  let numDetected = 0
  let hasVaryingMonitoredSpecies = false
  const monitoredSpp = Object.entries(speciesTotals)
    .map(
      ([id, { [displayField]: total, detectorNights: sppDetectorNights }]) => {
        const { commonName, sciName } = SPECIES[id]

        if (total > 0) {
          numDetected += 1
        }

        if (sppDetectorNights < detectorNights) {
          hasVaryingMonitoredSpecies = true
        }

        return {
          species: id,
          commonName,
          sciName,
          detected: total > 0,
          detectorNights: sppDetectorNights,
        }
      }
    )
    .sort((a, b) => (a.commonName < b.commonName ? -1 : 1))

  const numMonitored = monitoredSpp.length

  const rootURL =
    source === 'nabat'
      ? 'https://sciencebase.usgs.gov/nabat/#/projects'
      : 'https://batamp.databasin.org/datasets'
  const datasetInfo = dataset.split(',').map((d) => {
    const [name, id] = d.split('|')

    return {
      id,
      url: `${rootURL}/${id}`,
      name: name || `private dataset (${id})`,
    }
  })

  return (
    <>
      <Field label="Detector data contributed by:">
        {contributors.split(',').join(', ')}
        {organization ? (
          <Box sx={{ mt: '0.5rem' }}>Lead organization: {organization}</Box>
        ) : null}
      </Field>
      <Field label="Location:">
        {formatNumber(lat, 5)}° North / {formatNumber(lon, 5)}° East
      </Field>
      <Field label="Microphone height:">{micHt} meters</Field>
      <Field label="Detector effort:">
        Operated for {formatNumber(detectorNights, 0)} nights.
        <br />
        {detectionNights === detectorNights
          ? 'Bats detected on all nights.'
          : `Bats detected on ${formatNumber(detectionNights, 0)} nights.`}
        <br />
        This detector measured{' '}
        {countType === 'p' ? 'nightly presence only' : 'nightly activity'}.
      </Field>
      <Field
        label={`${numDetected} of ${numMonitored} monitored species were detected:`}
      >
        <Box
          as="ul"
          sx={{
            pl: 0,
            mb: '0.5rem',
            listStyle: 'none',
            '& li': {
              mb: 0,
            },
          }}
        >
          {monitoredSpp.map(
            ({
              species: spp,
              commonName,
              sciName,
              detected,
              detectorNights: sppDetectorNights,
            }) => (
              <Box
                key={spp}
                as="li"
                sx={{
                  color: spp === speciesID ? 'highlight.5' : 'inherit',
                }}
              >
                {detected ? (
                  <Check
                    size="1em"
                    style={{
                      color: 'green',
                      opacity: 0.5,
                      marginRight: '0.5rem',
                    }}
                  />
                ) : (
                  <Times
                    size="1em"
                    style={{
                      color: 'red',
                      opacity: 0.5,
                      marginRight: '0.5rem',
                    }}
                  />
                )}
                {commonName}{' '}
                <Text
                  sx={{
                    display: 'inline',
                    fontSize: '0.9rem',
                    color: spp === speciesID ? 'highlight.5' : 'grey.8',
                  }}
                >
                  ({sciName})
                </Text>
                {sppDetectorNights < detectorNights ? (
                  <Box
                    sx={{
                      color: 'grey.7',
                      mt: '-3px',
                      display: 'inline',
                      ml: '0.5rem',
                    }}
                    title={`reported on ${formatNumber(sppDetectorNights)} of ${formatNumber(detectorNights)} nights`}
                  >
                    <ExclamationTriangle size="0.75em" />
                  </Box>
                ) : null}
              </Box>
            )
          )}
        </Box>

        {hasVaryingMonitoredSpecies ? (
          <Text variant="help" sx={{ mt: '1rem' }}>
            <ExclamationTriangle
              size="1em"
              style={{ marginTop: '-3px', marginRight: '0.25rem' }}
            />
            This species was not consistently reported for all monitored nights.
            This may be due to unreported absences or methods that did not
            consistently monitor for all species above.
          </Text>
        ) : null}
      </Field>

      {detType ? (
        <Field label="Detector model:">{detType.split(',').join(', ')}</Field>
      ) : null}

      {micType ? (
        <Field label="Microphone:">{micType.split(',').join(', ')}</Field>
      ) : null}

      {reflType ? (
        <Field label="Reflector type:">{reflType.split(',').join(', ')}</Field>
      ) : null}

      {callId ? (
        <Field label="How were species identified?">
          {callId.split(',').join(', ')}
        </Field>
      ) : null}

      <Field label="Data source:">
        <Box>
          Source database:{' '}
          <Box
            as="ul"
            sx={{
              pl: '2rem',
              '& li+li': {
                mt: '0.25rem',
              },
            }}
          >
            <li>
              {source === 'nabat' ? (
                <OutboundLink to="https://www.nabatmonitoring.org/">
                  North American Bat Monitoring Program (NABat)
                  <ExternalLinkAlt
                    size="1em"
                    style={{
                      opacity: 0.6,
                      marginLeft: '0.5rem',
                      marginTop: '-4px',
                    }}
                  />
                </OutboundLink>
              ) : (
                <OutboundLink to="https://batamp.databasin.org">
                  Bat Acoustic Monitoring Portal (BatAMP)
                  <ExternalLinkAlt
                    size="1em"
                    style={{
                      opacity: 0.6,
                      marginLeft: '0.5rem',
                      marginTop: '-4px',
                    }}
                  />
                </OutboundLink>
              )}
            </li>
          </Box>
        </Box>
        <Box sx={{ mt: '1rem' }}>
          Source{' '}
          {quantityLabel(
            source === 'nabat' ? 'projects' : 'datasets',
            datasetInfo.length
          )}
          :
        </Box>
        <Box
          as="ul"
          sx={{
            pl: '2rem',
            '& li+li': {
              mt: '0.25rem',
            },
          }}
        >
          {datasetInfo.map(({ id, url, name }) => (
            <li key={id}>
              <OutboundLink to={url}>
                {name}
                <ExternalLinkAlt
                  size="1em"
                  style={{
                    opacity: 0.6,
                    marginLeft: '0.5rem',
                    marginTop: '-4px',
                  }}
                />
              </OutboundLink>
            </li>
          ))}
        </Box>

        <Text variant="help" sx={{ mt: '1rem' }}>
          The dataset {quantityLabel('pages', datasetInfo.length)} above may
          contain additional information about this detector and the methods
          used to detect species at this location.
        </Text>
      </Field>
    </>
  )
}

DetectorMetadata.propTypes = {
  displayField: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  countType: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  organization: PropTypes.string,
  contributors: PropTypes.string.isRequired,
  detType: PropTypes.string,
  micHt: PropTypes.number.isRequired,
  micType: PropTypes.string,
  reflType: PropTypes.string,
  callId: PropTypes.string,
  dataset: PropTypes.string.isRequired,
  detectorNights: PropTypes.number.isRequired,
  detectionNights: PropTypes.number.isRequired,
  speciesTotals: PropTypes.object.isRequired,
  speciesID: PropTypes.string,
}

DetectorMetadata.defaultProps = {
  organization: null,
  detType: null,
  micType: null,
  reflType: null,
  callId: null,
  speciesID: null,
}

export default DetectorMetadata
