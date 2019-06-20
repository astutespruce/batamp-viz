import React from 'react'
import PropTypes from 'prop-types'
import { FaCheck, FaTimes } from 'react-icons/fa'
import { css } from 'styled-components'

import { OutboundLink } from 'components/Link'
import styled, { themeGet } from 'style'
import { formatNumber, quantityLabel } from 'util/format'
import { SPECIES } from '../../../config/constants'

const Field = styled.section`
  &:not(:first-child) {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid ${themeGet('colors.grey.200')};
  }
`

const FieldHeader = styled.h4`
  margin-bottom: 0;
`

const FieldValue = styled.div`
  margin-left: 1rem;
  color: ${themeGet('colors.grey.900')};
`

const FieldValueList = styled.ul`
  margin-bottom: 0.5rem;

  li {
    margin-bottom: 0;
  }
`

const FieldHelp = styled.p`
  color: ${themeGet('colors.grey.700')};
  font-size: smaller;
  line-height: 1.2;
`

const SpeciesList = styled(FieldValueList)`
  list-style: none;
`

const DetectedIcon = styled(FaCheck)`
  height: 1em;
  width: 1em;
  margin-right: 0.25em;
  color: green;
  opacity: 0.5;
`

const NotDetectedIcon = styled(FaTimes)`
  height: 1em;
  width: 1em;
  margin-right: 0.25em;
  color: red;
  opacity: 0.5;
`

const SpeciesListItem = styled.li`
  ${({ highlight }) =>
    highlight &&
    css`
      color: ${themeGet('colors.highlight.500')};

      ${ScientificName} {
        color: ${themeGet('colors.highlight.500')};
      }
    `}
`

const ScientificName = styled.span`
  font-size: 0.8em;
  color: ${themeGet('colors.grey.600')};
`

const DetectorMetadata = ({
  lat,
  lon,
  micHt,
  mfg,
  model,
  micType,
  reflType,
  callId,
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
    .map(spp => {
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

  const datasetInfo = datasets.map(d => {
    const [id, name] = d.split(':')

    return {
      id,
      url: `https://batamp.databasin.org/datasets/${id}`,
      name: name || `private dataset (${id})`,
    }
  })

  return (
    <>
      <Field>
        <FieldHeader>Detector data contributed by:</FieldHeader>
        <FieldValue>{numContributors}</FieldValue>
      </Field>
      <Field>
        <FieldHeader>Location:</FieldHeader>
        <FieldValue>
          {formatNumber(lat, 2)}° North / {formatNumber(lon, 2)}° East
        </FieldValue>
      </Field>

      <Field>
        <FieldHeader>Microphone height:</FieldHeader>
        <FieldValue>{micHt} meters</FieldValue>
      </Field>
      <Field>
        <FieldHeader>Detector effort:</FieldHeader>
        <FieldValue>
          Operated for {formatNumber(detectorNights, 0)} nights.
          <br />
          {detectionNights === detectorNights
            ? 'Bats detected on all nights.'
            : `Bats detected on ${formatNumber(detectionNights, 0)} nights.`}
        </FieldValue>
      </Field>
      <Field>
        <FieldHeader>
          {numDetected} of {numMonitored} monitored species were detected:
        </FieldHeader>
        <SpeciesList>
          {monitoredSpp.map(
            ({ species: spp, commonName, sciName, detected }) => (
              <SpeciesListItem key={spp} highlight={spp === selectedSpecies}>
                {detected ? <DetectedIcon /> : <NotDetectedIcon />}
                {commonName} <ScientificName>({sciName})</ScientificName>
              </SpeciesListItem>
            )
          )}
        </SpeciesList>
      </Field>

      {mfg ? (
        <Field>
          <FieldHeader>Detector model:</FieldHeader>
          <FieldValue>
            {mfg}
            {model ? `(${model})` : null}
          </FieldValue>
        </Field>
      ) : null}

      {micType ? (
        <Field>
          <FieldHeader>Microphone type:</FieldHeader>
          <FieldValue>{micType}</FieldValue>
        </Field>
      ) : null}

      {reflType ? (
        <Field>
          <FieldHeader>Reflector type:</FieldHeader>
          <FieldValue>{reflType}</FieldValue>
        </Field>
      ) : null}

      {callId ? (
        <Field>
          <FieldHeader>How were species identified?</FieldHeader>
          <FieldValue>{callId}</FieldValue>
        </Field>
      ) : null}

      <Field>
        <FieldHeader>
          Source {quantityLabel('datasets', datasetInfo.length)} on{' '}
          <OutboundLink
            from="/"
            to="https://batamp.databasin.org/"
            target="_blank"
          >
            BatAMP
          </OutboundLink>
          :
        </FieldHeader>
        {datasetInfo.length === 1 ? (
          <FieldValue>
            <OutboundLink from="/" to={datasetInfo[0].url}>
              {datasetInfo[0].name}
            </OutboundLink>
          </FieldValue>
        ) : (
          <FieldValueList>
            {datasetInfo.map(({ id, url, name }) => (
              <li key={id}>
                <OutboundLink from="/" to={url}>
                  {name}
                </OutboundLink>
              </li>
            ))}
          </FieldValueList>
        )}
        <FieldHelp>
          The dataset page on BatAMP may contain additional information about
          this detector and the methods used to detect species at this location.
        </FieldHelp>
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
  species: [],
  selectedSpecies: null,
}

export default DetectorMetadata
