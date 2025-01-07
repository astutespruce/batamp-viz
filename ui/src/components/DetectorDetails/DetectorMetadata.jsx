import React from 'react'
import PropTypes from 'prop-types'
import { Check, Times } from '@emotion-icons/fa-solid'
import { Box, Text } from 'theme-ui'

import { OutboundLink } from 'components/Link'
import { SPECIES } from 'config'
import { formatNumber, quantityLabel } from 'util/format'
import Field from './Field'

const DetectorMetadata = ({
  lat,
  lon,
  micHt,
  mfg,
  model,
  micType,
  reflType,
  callId,
  presenceOnly,
  datasets,
  contributors,
  detectorNights,
  detectionNights,
  species,
  targetSpecies,
  selectedSpecies,
}) => {
  const numContributors = contributors.split(', '.length)

  const detectedSpp = new Set(species)
  const monitoredSpp = targetSpecies
    .map((spp) => {
      const { commonName, sciName } = SPECIES[spp]

      return {
        species: spp,
        commonName,
        sciName,
        detected: detectedSpp.has(spp),
      }
    })
    .sort((a, b) => (a.commonName < b.commonName ? -1 : 1))

  const numMonitored = monitoredSpp.length
  const numDetected = detectedSpp.size

  const datasetInfo = datasets.map((d) => {
    const [id, name] = d.split(':')

    return {
      id,
      url: `https://batamp.databasin.org/datasets/${id}`,
      name: name || `private dataset (${id})`,
    }
  })

  return (
    <>
      <Field label="Detector data contributed by:">{numContributors}</Field>
      <Field label="Location:">
        {formatNumber(lat, 2)}° North / {formatNumber(lon, 2)}° East
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
        {presenceOnly ? 'nightly presence only' : 'nightly activity'}.
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
            ({ species: spp, commonName, sciName, detected }) => (
              <Box
                key={spp}
                as="li"
                sx={{
                  color: spp === selectedSpecies ? 'highlight.5' : 'inherit',
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
                    color: spp === selectedSpecies ? 'highlight.5' : 'grey.8',
                  }}
                >
                  ({sciName})
                </Text>
              </Box>
            )
          )}
        </Box>
      </Field>

      {mfg ? (
        <Field label="Detector model:">
          {mfg}
          {model ? `(${model})` : null}
        </Field>
      ) : null}

      {micType ? <Field label="Microphone type:">{micType}</Field> : null}

      {reflType ? <Field label="Reflector type:">{reflType}</Field> : null}

      {callId ? (
        <Field label="How were species identified?">{callId}</Field>
      ) : null}

      <Field
        label={`Source ${quantityLabel('datasets', datasetInfo.length)} on BatAMP:`}
      >
        {datasetInfo.length === 1 ? (
          <OutboundLink to={datasetInfo[0].url}>
            {datasetInfo[0].name}
          </OutboundLink>
        ) : (
          <Box
            as="ul"
            sx={{
              pl: 0,
              listStyle: 'none',
              my: '0.5rem',
              '& li+li': {
                mt: '0.5rem',
              },
            }}
          >
            {datasetInfo.map(({ id, url, name }) => (
              <li key={id}>
                <OutboundLink to={url}>{name}</OutboundLink>
              </li>
            ))}
          </Box>
        )}
        <Text variant="help" sx={{ ml: '-1rem' }}>
          The dataset page(s) on BatAMP may contain additional information about
          this detector and the methods used to detect species at this location.
        </Text>
      </Field>
    </>
  )
}

DetectorMetadata.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  micHt: PropTypes.number.isRequired,
  contributors: PropTypes.string.isRequired,
  mfg: PropTypes.string,
  model: PropTypes.string,
  micType: PropTypes.string,
  reflType: PropTypes.string,
  callId: PropTypes.string,
  presenceOnly: PropTypes.number,
  datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
  detectorNights: PropTypes.number.isRequired,
  detectionNights: PropTypes.number.isRequired,
  species: PropTypes.arrayOf(PropTypes.string),
  targetSpecies: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedSpecies: PropTypes.string,
}

DetectorMetadata.defaultProps = {
  mfg: null,
  model: null,
  micType: null,
  reflType: null,
  callId: null,
  presenceOnly: 0,
  species: [],
  selectedSpecies: null,
}

export default DetectorMetadata
