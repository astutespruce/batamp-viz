import React from 'react'
import PropTypes from 'prop-types'
import { Set } from 'immutable'
import { FaCheck, FaTimes } from 'react-icons/fa'

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
`

const NotDetectedIcon = styled(FaTimes)`
  height: 1em;
  width: 1em;
  margin-right: 0.25em;
  color: red;
`

const SpeciesListItem = styled.li``

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
  idMethods,
  datasets,
  contributors,
  detectorNights,
  detectionNights,
  species,
  targetSpecies,
}) => {
  const numContributors = contributors.split(', '.length)

  const detectedSpp = Set(species)
  const monitoredSpp = targetSpecies
    .map(spp => {
      const { commonName, sciName } = SPECIES[spp]

      return {
        commonName,
        sciName,
        detected: detectedSpp.has(spp),
      }
    })
    .sort((a, b) => (a.commonName < b.commonName ? -1 : 1))

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
        <FieldHeader>Monitored species that were detected:</FieldHeader>
        <SpeciesList>
          {monitoredSpp.map(({ commonName, sciName, detected }) => (
            <SpeciesListItem>
              {detected ? <DetectedIcon /> : <NotDetectedIcon />}
              {commonName} <ScientificName>({sciName})</ScientificName>
            </SpeciesListItem>
          ))}
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

      {idMethods && idMethods.length ? (
        <Field>
          <FieldHeader>How were species identified?</FieldHeader>
          <FieldValueList>
            {idMethods.map(method => (
              <li>{method}</li>
            ))}
          </FieldValueList>
        </Field>
      ) : null}

      <Field>
        <FieldHeader>
          Source {quantityLabel('datasets', datasets.length)} on{' '}
          <OutboundLink
            from="/"
            to="https://batamp.databasin.org/"
            target="_blank"
          >
            BatAMP
          </OutboundLink>
          :
        </FieldHeader>
        {datasets.size === 1 ? (
          <FieldValue>
            <OutboundLink
              from="/"
              to={`https://batamp.databasin.org/datasets/${datasets.get(0)}`}
              target="_blank"
            >
              {datasets.get(0)}
            </OutboundLink>
          </FieldValue>
        ) : (
          <FieldValueList>
            {datasets.map(dataset => (
              <li key={dataset}>
                <OutboundLink
                  from="/"
                  to={`https://batamp.databasin.org/datasets/${dataset}`}
                  target="_blank"
                >
                  {dataset}
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
  idMethods: PropTypes.string,
  datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
  detectorNights: PropTypes.number.isRequired,
  detectionNights: PropTypes.number.isRequired,
  species: PropTypes.arrayOf(PropTypes.string).isRequired,
  targetSpecies: PropTypes.arrayOf(PropTypes.string).isRequired,
}

DetectorMetadata.defaultProps = {
  mfg: null,
  model: null,
  micType: null,
  reflType: null,
  idMethods: null,
}

export default DetectorMetadata
