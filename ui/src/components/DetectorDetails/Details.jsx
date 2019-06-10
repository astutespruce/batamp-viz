import React, { memo, useContext } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { FaRegTimesCircle } from 'react-icons/fa'
import { useStaticQuery, graphql } from 'gatsby'

import { Text } from 'components/Text'
import Tabs, { Tab as BaseTab } from 'components/Tabs'
import { Context } from 'components/Crossfilter'
import { Column, Columns, RightColumn, Box, Flex } from 'components/Grid'
import { HorizontalBarChart } from 'components/Chart'
import { SeasonalityCharts } from 'components/UnitDetails'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { extractNodes } from 'util/graphql'
import { sumBy, groupBy } from 'util/data'
import { MONTHS } from '../../../config/constants'

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

const Section = styled(Box).attrs({ py: '1rem' })``

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

const Metric = styled.span`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.700')};
  font-weight: normal;
  text-transform: initial;
`

const Highlight = styled(Text)`
  color: ${themeGet('colors.highlight.500')};
`

const metricLabels = {
  detections: 'detections',
  nights: 'nights detected',
}

const Details = ({ detector, selectedSpecies, onClose }) => {
  const { state } = useContext(Context)
  const valueField = state.get('valueField')

  const {
    name,
    detections,
    admin1Name,
    country,
    detectorNights,
    dateRange,
  } = detector.toJS()

  const ts = detector.get('ts')

  const sppNames = extractNodes(
    useStaticQuery(graphql`
      query {
        allSpeciesJson {
          edges {
            node {
              species
              sciName
              commonName
            }
          }
        }
      }
    `).allSpeciesJson
  ).reduce((prev, { species, commonName, sciName }) => {
    prev[species] = { commonName, sciName }
    return prev
  }, {})

  // calculate totals by species
  const sppTotals = sumBy(ts, 'species', valueField)
    .entrySeq()
    .toList()
    .sort(([sppA, a], [sppB, b]) => (a < b ? 1 : -1))

  const max = Math.max(...Array.from(sppTotals.map(([_, value]) => value)))

  // aggregate full monthly time series by species
  const monthlyData = groupBy(ts, 'species').map(records => {
    const byMonth = sumBy(records, 'month', valueField)
    return MONTHS.map(month => byMonth.get(month, 0))
  })

  const seasonalityData = sppTotals
    .map(([species]) => {
      return {
        species,
        ...sppNames[species],
        values: monthlyData.get(species),
      }
    })
    .toJS()

  const metric = metricLabels[valueField]

  const selectedSpeciesName = sppNames[selectedSpecies]

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
              {formatNumber(detections, 0)} detections
              <br />
              {detectorNights} nights monitored
            </RightColumn>
          </Columns>
        </Summary>
      </Header>

      <TabContainer>
        <Tab id="species" label="Species Detected">
          {selectedSpecies ? (
            <Section>
              <Highlight>
                {`${selectedSpeciesName.commonName} (${
                  selectedSpeciesName.sciName
                })`}{' '}
                is highlighted below.
              </Highlight>
            </Section>
          ) : null}

          <Section>
            <SectionHeader>{metric}</SectionHeader>
            {sppTotals.map(([spp, total]) => (
              <HorizontalBarChart
                key={spp}
                label={sppNames[spp].commonName}
                sublabel={`(${sppNames[spp].sciName})`}
                quantity={total}
                max={max}
                highlight={spp === selectedSpecies}
              />
            ))}
          </Section>

          <Section>
            <SectionHeader>
              Seasonality <Metric>(number of {metric})</Metric>
            </SectionHeader>
            <SeasonalityCharts
              data={seasonalityData}
              selectedSpecies={selectedSpecies}
            />
          </Section>
        </Tab>

        <Tab id="overview" label="Detector Information">
          <DetectorMetadata {...detector.toJS()} />
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
    ts: ImmutablePropTypes.listOf(ImmutablePropTypes.mapContains({
      detections: PropTypes.number.isRequired,
      nights: PropTypes.number.isRequired,
      month: PropTypes.number.isRequired,
      year: PropTypes.number.isRequired,
    })).isRequired,
  }).isRequired,
  selectedSpecies: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

Details.defaultProps = {
  selectedSpecies: null,
}

export default memo(Details)
