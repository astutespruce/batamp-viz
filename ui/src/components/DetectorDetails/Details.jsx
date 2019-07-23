import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { FaRegTimesCircle, FaExclamationTriangle } from 'react-icons/fa'

import { Text, HelpText } from 'components/Text'
import Tabs, { Tab as BaseTab } from 'components/Tabs'
import { useCrossfilter } from 'components/Crossfilter'
import { Column, Columns, RightColumn, Box, Flex } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { sumBy, groupBy, filterObject } from 'util/data'
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

const Highlight = styled(Box)`
  color: ${themeGet('colors.highlight.500')};
  margin-bottom: 2rem;
`

const Details = ({ detector, selectedSpecies, onClose }) => {
  const { state } = useCrossfilter()

  const { hasVisibleFilters } = state
  let { valueField } = state
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
    presenceOnly,
    dateRange,
    years,
    ts,
  } = detector

  // calculate totals by species, for non-zero species

  const bySpp = filterObject(sumBy(ts, 'species', valueField), d => d > 0)

  const sppTotals = Object.entries(bySpp).sort(([sppA, a], [sppB, b]) =>
    a < b ? 1 : -1
  )

  // If we are showing nights, we need to show the true effort which is
  // number of detector nights
  const max =
    valueField === 'detectionNights'
      ? detectorNights
      : Math.max(0, ...Object.values(bySpp))

  // create a map of species to array of monthly data, with an entry populated for each month
  const monthlyData =
    ts.length > 0
      ? Object.assign(
          ...Object.entries(groupBy(ts, 'species')).map(([spp, records]) => {
            const byMonth = sumBy(records, 'month', valueField)
            return { [spp]: MONTHS.map(month => byMonth[month] || 0) }
          })
        )
      : []

  const seasonalityData = sppTotals.map(([spp]) => {
    return {
      species: spp,
      ...SPECIES[spp],
      values: monthlyData[spp],
    }
  })

  const metric = METRIC_LABELS[valueField]

  const hasBats = detectionNights > 0
  const hasSpecies = species && species.length > 0

  let speciesWarning = null
  let presenceOnlyWarning = null

  if (presenceOnly && metric === 'detections') {
    presenceOnlyWarning = (
      <Highlight>
        <WarningIcon />
        This detector monitored nightly occurrence instead of nightly activity.
        Only one detection was recorded per night for each species.
      </Highlight>
    )
  }

  if (!hasBats) {
    speciesWarning = (
      <Highlight>
        <WarningIcon />
        No bats were detected on any night.
      </Highlight>
    )
  } else if (!hasSpecies) {
    speciesWarning = (
      <Highlight>
        <WarningIcon />
        No species were detected on any night.
        <br />
        {detectionNights} bat detections were not identified to species.
      </Highlight>
    )
  }

  const filterNote = hasVisibleFilters ? (
    <HelpText fontSize="0.8rem" mb="1rem">
      <WarningIcon />
      Note: your filters are not applied to the following data.
    </HelpText>
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

          {speciesWarning || (
            <>
              <SectionHeader>Total {metric}</SectionHeader>
              {presenceOnlyWarning}
              <TotalCharts
                data={sppTotals}
                selectedSpecies={selectedSpecies}
                max={max}
              />
            </>
          )}
        </Tab>
        <Tab id="seasonality" label="Seasonality">
          {filterNote}

          {speciesWarning || (
            <>
              <SectionHeader>{metric} by month</SectionHeader>

              {years > 1 && (
                <HelpText fontSize="0.8rem" mb="1rem">
                  Note: monthly data may include multiple years.
                </HelpText>
              )}

              {presenceOnlyWarning}

              <SeasonalityCharts
                data={seasonalityData}
                selectedSpecies={selectedSpecies}
              />
            </>
          )}
        </Tab>

        <Tab id="overview" label="Detector Information">
          <DetectorMetadata {...detector} selectedSpecies={selectedSpecies} />
        </Tab>
      </TabContainer>
    </Wrapper>
  )
}

Details.propTypes = {
  detector: PropTypes.shape({
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
    presenceOnly: PropTypes.number,
    datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
    detectorNights: PropTypes.number.isRequired,
    detectionNights: PropTypes.number.isRequired,
    dateRange: PropTypes.string.isRequired,
    years: PropTypes.number.isRequired,
    admin1Name: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    ts: PropTypes.arrayOf(
      PropTypes.shape({
        detections: PropTypes.number,
        detectionNights: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired,
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
