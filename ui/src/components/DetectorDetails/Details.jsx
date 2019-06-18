import React, { memo } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { FaRegTimesCircle, FaExclamationTriangle } from 'react-icons/fa'

import { Text, HelpText } from 'components/Text'
import Tabs, { Tab as BaseTab } from 'components/Tabs'
import { useCrossfilter } from 'components/Crossfilter'
import { Column, Columns, RightColumn, Box, Flex } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { sumBy, groupBy } from 'util/data'
import TotalCharts from './TotalCharts'
import SeasonalityCharts from './SeasonalityCharts'
import { MONTHS, SPECIES, METRIC_LABELS } from '../../../config/constants'

import DetectorMetadata from './DetectorMetadata'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Header = styled.div`
  flex: 0;
  padding: 1rem 1rem 0.5rem;
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
  line-height: 1.5;
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
  flex: 1;
  height: 100%;
`

const Tab = styled(BaseTab)`
  padding: 1rem;
  overflow-y: auto;
  overflow-x: auto;
  flex: 1 1 auto;
`

const SectionHeader = styled(Text).attrs({
  as: 'h3',
  py: '0.5rem',
  px: '1rem',
})`
  background-color: ${themeGet('colors.grey.200')};
  border-radius: 0.5rem;
  text-align: center;
  text-transform: capitalize;
`

const WarningIcon = styled(FaExclamationTriangle)`
  width: 1.5em;
  height: 1em;
`

const FilterNote = styled(HelpText)`
  font-size: 0.8rem;
  margin-bottom: 1rem;
`

const Highlight = styled(Box)`
  color: ${themeGet('colors.highlight.500')};
`

const Details = ({ detector, selectedSpecies, onClose }) => {
  const { state } = useCrossfilter()
  let valueField = state.get('valueField')
  if (valueField === 'id' || valueField === 'species') {
    valueField = 'detectionNights'
  }

  const {
    name,
    detections,
    admin1Name,
    country,
    species,
    detectionNights,
    detectorNights,
    dateRange,
  } = detector.toJS()

  const ts = detector.get('ts')

  // calculate totals by species
  const bySpp = sumBy(ts, 'species', valueField)

  const sppTotals = bySpp
    .entrySeq()
    .toList()
    .sort(([sppA, a], [sppB, b]) => (a < b ? 1 : -1))

  // If we are showing nights, we need to show the true effort which is
  // number of detector nights
  const max =
    valueField === 'detectionNights'
      ? detectorNights
      : Math.max(...Array.from(sppTotals.map(([_, value]) => value)))

  // aggregate full monthly time series by species
  const monthlyData = groupBy(ts, 'species').map(records => {
    const byMonth = sumBy(records, 'month', valueField)
    return MONTHS.map(month => byMonth.get(month, 0))
  })

  const seasonalityData = sppTotals.map(([spp]) => {
    return {
      species: spp,
      ...SPECIES[spp],
      values: monthlyData.get(spp),
    }
  })

  const metric = METRIC_LABELS[valueField]

  const hasSpecies = species && species.length > 0

  let noSpeciesWarning = null
  if (!hasSpecies) {
    noSpeciesWarning = (
      <Highlight>
        <WarningIcon />
        No species were detected on any night.
        <br />
        {detectionNights} bat detections were not identified to species.
      </Highlight>
    )
  }

  const filterNote = state.get('hasVisibleFilters') ? (
    <FilterNote>
      <WarningIcon />
      Note: your filters are not applied to the following data.
    </FilterNote>
  ) : null

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

              <br />
              {dateRange}
            </Column>
            <RightColumn>
              <b>{formatNumber(detections, 0)}</b> species detections
              <br />
              <b>{formatNumber(detectorNights, 0)}</b> nights monitored
            </RightColumn>
          </Columns>
        </Summary>
      </Header>

      <TabContainer>
        <Tab id="species" label="Species Detected">
          {filterNote}
          <SectionHeader>Total {metric}</SectionHeader>

          {hasSpecies ? (
            <TotalCharts
              data={sppTotals.toJS()}
              selectedSpecies={selectedSpecies}
              max={max}
            />
          ) : (
            noSpeciesWarning
          )}
        </Tab>
        <Tab id="seasonality" label="Seasonality">
          {filterNote}

          <SectionHeader>{metric} per month</SectionHeader>

          {hasSpecies ? (
            <SeasonalityCharts
              data={seasonalityData.toJS()}
              selectedSpecies={selectedSpecies}
            />
          ) : (
            noSpeciesWarning
          )}
        </Tab>

        <Tab id="overview" label="Detector Information">
          <DetectorMetadata
            {...detector.toJS()}
            selectedSpecies={selectedSpecies}
          />
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
    contributors: PropTypes.string.isRequired,
    mfg: PropTypes.string,
    model: PropTypes.string,
    micType: PropTypes.string,
    reflType: PropTypes.string,
    idMethods: PropTypes.arrayOf(PropTypes.string),
    datasets: ImmutablePropTypes.listOf(PropTypes.string).isRequired,
    detectorNights: PropTypes.number.isRequired,
    detectionNights: PropTypes.number.isRequired,
    dateRange: PropTypes.string.isRequired,
    admin1Name: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    ts: ImmutablePropTypes.listOf(
      ImmutablePropTypes.mapContains({
        detections: PropTypes.number,
        detectionNights: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired,
        year: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  selectedSpecies: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

Details.defaultProps = {
  selectedSpecies: null,
}

export default memo(Details)
