import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { List, fromJS, Set, Map as ImmutableMap } from 'immutable'
import { scaleLinear } from 'd3-scale'

import { Box } from 'components/Grid'
import { Text } from 'components/Text'
import Layout from 'components/Layout'
import Sidebar from 'components/Sidebar'
import { BarChart, HorizontalBarChart, TableChart } from 'components/Chart'
import { SeasonalityCharts } from 'components/UnitDetails'
import { createIndex, groupBy, sumBy, sum } from 'util/data'
import { formatNumber, quantityLabel } from 'util/format'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import styled, { themeGet } from 'style'
import { NABounds, MONTHS, MONTH_LABELS } from '../../config/constants'

const Section = styled(Box).attrs({ p: '1rem' })``

const SectionHeader = styled(Text).attrs({ as: 'h3' })``

const BarChartWrapper = styled.div`
  &:not(:first-child) {
    margin-top: 2rem;
  }
`

// const chartHeight = 100
// const minChartHeight = 20

const Test = ({ data: { allSpeciesJson, allDetectorTsJson } }) => {
  const valueField = 'detections'
  const selectedSpp = 'laci'
  const allSpecies = fromJS(extractNodes(allSpeciesJson))
  const detectorTS = fromJS(extractNodes(allDetectorTsJson))

  const speciesIndex = createIndex(allSpecies, 'species')

  const grouped = groupBy(detectorTS, 'species')
  console.log('grouped', grouped.toJS())

  const totals = sumBy(detectorTS, 'species', valueField)
    .entrySeq()
    .toList()
    .sort(([sppA, a], [sppB, b]) => (a < b ? 1 : -1))


  const monthlyData = totals.map(([species]) => {
    // group data by month
    const byMonth = sumBy(grouped.get(species), 'month', valueField)

    return {
      species,
      label: speciesIndex.get(species).get('commonName') + " (" + speciesIndex.get(species).get('sciName') + ')',
      values: MONTHS.map(month => byMonth.get(month, 0)),
    }
  }).toJS()

//   window.grouped = grouped
//   window.totals = totals
//   window.monthlyData = monthlyData

  //   const sortedSpp = totals.map(([spp]) => spp)

  const max = Math.max(...Array.from(totals.map(([_, value]) => value)))

  //   const getTotalsByMonth = species => {
  //     const byMonth = sumBy(grouped.get(species), 'month', valueField)
  //     return MONTHS.map(month => byMonth.get(month, 0))
  //   }

  //   const monthlyData = grouped.map((v, k) => getTotalsByMonth(k))
  //   const monthlyMaxBySpp = monthlyData.map(d => Math.max(...d))
  //   const monthlyMax = Math.max(...Array.from(monthlyMaxBySpp.valueSeq()))
  //   console.log('monthly data', monthlyData.toJS(), monthlyMax)

  const getSpeciesLabel = species => {
    const spp = speciesIndex.get(species)
    return spp.get('commonName')
  }

  //   const chartScale = scaleLinear()
  //     .domain([1, monthlyMax])
  //     .range([6, 100])

  return (
    <Layout title="Chart test">
      <Sidebar>
        <Section>
          <SectionHeader>Species present: (# detections)</SectionHeader>
          {totals.map(([spp, total]) => (
            <HorizontalBarChart
              key={spp}
              label={getSpeciesLabel(spp)}
              quantity={total}
              max={max}
              highlight={spp === selectedSpp}
            />
          ))}
        </Section>

        <Section>
          <SectionHeader>Seasonality: (# detections)</SectionHeader>

          <SeasonalityCharts selectedSpecies={selectedSpp} data={monthlyData} />

          {/* {sortedSpp.map(spp => (
            <BarChartWrapper key={spp}>
              <BarChart
                title={getSpeciesLabel(spp)}
                data={monthlyData.get(spp).map((d, i) => ({
                  value: d,
                  label: MONTH_LABELS[i].slice(0, 3),
                }))}
                scale={chartScale}
                highlight={spp === selectedSpp}
              />
            </BarChartWrapper>
          ))} */}
        </Section>
      </Sidebar>
    </Layout>
  )
}

Test.propTypes = {
  data: PropTypes.shape({
    allSpeciesJson: GraphQLArrayPropType(
      PropTypes.shape({
        species: PropTypes.string.isRequired,
        commonName: PropTypes.string.isRequired,
        sciName: PropTypes.string.isRequired,
        detections: PropTypes.number.isRequired,
        nights: PropTypes.number.isRequired,
        detectors: PropTypes.number.isRequired,
        contributors: PropTypes.arrayOf(PropTypes.string).isRequired,
      })
    ).isRequired,
    allDetectorTsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        year: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired,
        detections: PropTypes.number.isRequired,
        nights: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query TestPageQuery {
    allSpeciesJson {
      edges {
        node {
          species
          commonName
          sciName
          detections
          nights: detectionNights
          detectors
          contributors
        }
      }
    }
    allDetectorTsJson(filter: { i: { eq: 356 } }) {
      edges {
        node {
          id: i
          species: s
          year: y
          month: m
          detections: d
          nights: n
        }
      }
    }
  }
`

export default Test
