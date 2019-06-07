import React, { memo } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { FaRegTimesCircle } from 'react-icons/fa'

import { Text } from 'components/Text'
import Tabs, { Tab as BaseTab } from 'components/Tabs'
import { OutboundLink } from 'components/Link'
import { Column, Columns, RightColumn, Box, Flex } from 'components/Grid'
import { SeasonalityCharts } from 'components/UnitDetails'
import styled, { themeGet } from 'style'
import { formatNumber, quantityLabel } from 'util/format'
import { sumBy, groupBy } from 'util/data'
import { MONTHS, COUNTRIES } from '../../../config/constants'

const Wrapper = styled.div``

const Header = styled.div`
  padding: 0.5rem 1rem;
  background-color: ${themeGet('colors.highlight.100')};
  line-height: 1.2;
  border-bottom: 2px solid ${themeGet('colors.grey.500')};
`

const Title = styled(Text).attrs({ as: 'h1' })`
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
`

const Summary = styled(Box).attrs({ pt: '0.5rem', mt: '0.25rem' })`
  border-top: 1px solid #fff;
  font-size: 0.9rem;
  color: ${themeGet('colors.grey.900')};
`

const Stats = styled(Box)`
  border-top: 1px solid ${themeGet('colors.grey.400')};
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
  font-size: 0.8rem;
`

const CloseIcon = styled(FaRegTimesCircle).attrs({ size: '1.5rem' })`
  height: 1.5rem;
  width: 1.5rem;
  cursor: pointer;
  color: ${themeGet('colors.grey.600')};
  &:hover {
    color: ${themeGet('colors.grey.900')};
  }
`

const TabContainer = styled(Tabs)`
  height: 100%;
`

const Tab = styled(BaseTab)`
  padding: 1rem;
  overflow-y: auto;
  flex: 1 1 auto;
`

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

const formatDateRange = dateRange => {
  if (dateRange.length === 1) return dateRange[0]

  return dateRange.join(' - ')
}

const Details = ({ detector, selectedSpecies, onClose }) => {
  const {
    lat,
    lon,
    name,
    micHt,
    detections,
    // dateRange,
    contributors,
    mfg,
    model,
    micType,
    reflType,
    idMethods,
    datasets,
    admin1Name,
    country,
    detectorNights,
    detectionNights,
    dateRange,
    species: speciesPresent,
  } = detector.toJS()

  const ts = detector.get('ts')

  // FIXME - make a prop
  const valueField = 'detections'

  // calculate totals by species
  const sppTotals = sumBy(ts, 'species', valueField)
    .entrySeq()
    .toList()
    .sort(([sppA, a], [sppB, b]) => (a < b ? 1 : -1))

  // aggregate full monthly time series by species
  const monthlyData = groupBy(ts, 'species').map(records => {
    const byMonth = sumBy(records, 'month', valueField)
    return MONTHS.map(month => byMonth.get(month, 0))
  })

  const seasonalityData = sppTotals
    .map(([species]) => ({
      species,
      label: species,
      values: monthlyData.get(species),
    }))
    .toJS()

    console.log(sppTotals.toJS(), monthlyData.toJS(), seasonalityData)

  return (
    <Wrapper>
      <Header>
        <Columns>
          <Column flex={1}>
            <Title>{name}</Title>
          </Column>
          <Column flex={0}>
            <CloseIcon onClick={onClose} />
          </Column>
        </Columns>
        <Summary>
          <Columns>
            <Column>
              <b>
                {admin1Name}, {country}
              </b>
            </Column>
            <RightColumn>{dateRange}</RightColumn>
          </Columns>
        </Summary>
      </Header>

      <TabContainer>
        <Tab id="species" label="Species Detections">
          <b>{formatNumber(detections, 0)}</b> detections of{' '}
          <b>{speciesPresent.length}</b> species recorded on{' '}
          {detectionNights < detectorNights ? (
            <>
              <b>{detectionNights}</b>
              out of
            </>
          ) : null}{' '}
          <b>{detectorNights}</b> nights monitored.
          <br />
          <SeasonalityCharts
            data={seasonalityData}
            selectedSpecies={selectedSpecies}
          />
          <br />
          TODO: highlight if any species are out of their ranges
        </Tab>
        <Tab id="overview" label="Detector Information">
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
            <FieldHeader>Detector data contributed by:</FieldHeader>
            <FieldValue>{contributors}</FieldValue>
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
              The dataset page on BatAMP may contain additional information
              about this detector and the methods used to detect species at this
              location.
            </FieldHelp>
          </Field>
        </Tab>
      </TabContainer>
    </Wrapper>
  )
}

Details.propTypes = {
  detector: ImmutablePropTypes.mapContains({
    name: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    micHt: PropTypes.number.isRequired,
    detections: PropTypes.number.isRequired,
    // nights: PropTypes.number.isRequired,
    // dateRange: PropTypes.arrayOf(PropTypes.string).isRequired,
    contributors: PropTypes.string.isRequired,
    mfg: PropTypes.string,
    model: PropTypes.string,
    micType: PropTypes.string,
    reflType: PropTypes.string,
    idMethods: PropTypes.arrayOf(PropTypes.string),
    datasets: ImmutablePropTypes.listOf(PropTypes.string).isRequired,
    species: PropTypes.arrayOf(PropTypes.string).isRequired,
    // speciesRanges: PropTypes.arrayOf(PropTypes.string).isRequired,
    detectorNights: PropTypes.number.isRequired,
    detectionNights: PropTypes.number.isRequired,
    dateRange: PropTypes.string.isRequired,
    admin1Name: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    ts: PropTypes.shape({
      detections: PropTypes.number.isRequired,
      nights: PropTypes.number.isRequired,
      month: PropTypes.number.isRequired,
      year: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  selectedSpecies: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

Details.defaultProps = {
  selectedSpecies: null,
}

export default memo(Details)
