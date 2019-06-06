import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { List, fromJS, Set, Map as IMap } from 'immutable'

import Layout from 'components/Layout'
import { Switch } from 'components/Form'
import { Text } from 'components/Text'
import {
  hasValue,
  Provider as CrossfilterProvider,
  FilteredMap as Map,
  ValueFieldSelector,
  TimePlayer,
} from 'components/Crossfilter'
// import Map from 'components/Map'
import Sidebar from 'components/Sidebar'
import { Box, Column, Columns, Flex } from 'components/Grid'
import FiltersList from 'components/FiltersList'
import DetectorDetails from 'components/DetectorDetails'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import { withinBounds } from 'components/Map/util'
import { createIndex, filterIndex, groupBy } from 'util/data'
import { NABounds, MONTHS, MONTH_LABELS } from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
`

const Header = styled.div`
  padding: 0.5rem 1rem;
  background-color: ${themeGet('colors.highlight.100')};
  line-height: 1.2;
`

const CommonName = styled(Text).attrs({ as: 'h1' })`
  margin: 0;
  font-weight: normal;
`

const ScientificName = styled(Text).attrs({ as: 'h3' })`
  margin: 0;
  font-weight: normal;
  font-style: italic;
  color: ${themeGet('colors.grey.700')};
`

const Stats = styled(Columns).attrs({ px: '1rem' })`
  border-top: 1px solid ${themeGet('colors.grey.400')};
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
  color: ${themeGet('colors.grey.800')};
  font-size: 0.8rem;
`

const RightColumn = styled(Column)`
  text-align: right;
`

const boundsFilterFunc = mapBounds => ({ lat, lon }) =>
  withinBounds({ lat, lon }, mapBounds)

const SpeciesTemplate = ({
  data: {
    speciesJson: {
      species,
      commonName,
      sciName,
      detections: totalDetections,
      nights: totalNights,
      detectors: totalDetectors,
      contributors,
    },
    allDetectorsJson,
    allDetectorTsJson,
    allAdmin1SpeciesTsJson,
  },
}) => {
  const valueField = 'detections'
  const [selected, setSelected] = useState({features: Set(), feature: null})
  const [filterByBounds, setFilterByBounds] = useState(true)

  const detectors = fromJS(extractNodes(allDetectorsJson).map(d => ({
    // note: detector height is multiplied by 10 to make into integer,
    // reverse that here
    ...d,
    micHt: d.micHt / 10,
  })))
  const detectorIndex = createIndex(detectors, 'id')

  const detectorTS = fromJS(extractNodes(allDetectorTsJson))

  const data = detectorTS.filter(d => d.get('species') === species).map(d => {
      const detector = detectorIndex.get(d.get('id'))
      return d.merge({
        lat: detector.get('lat'),
        lon: detector.get('lon'),
        name: detector.get('name'),
      })
    })

  const handleToggleBoundsFilter = () => {
    setFilterByBounds(prev => !prev)
  }

  const handleSelectFeatures = ids => {
    const features = detectorIndex.filter((_, k)=> ids.has(k)).toList().map(d => d.merge({
      ts: groupBy(detectorTS.filter(v => v.get('id') === d.get('id')), 'species')
    }))
    setSelected({
      features,
      feature: features.size ? features.first().get('id') : null
    })
  }

  const handleSetFeature = feature => {
    setSelected({
      features: selected.features,
      feature
    })
  }

  const handleDetailsClose = () => {
    setSelected({features: Set(), feature: null})
  }

  const filters = [
    {
      field: 'id',
      internal: true,
      filterFunc: hasValue,
    },
    {
      field: 'month',
      title: 'Month', // TODO: variable
      isOpen: true,
      values: MONTHS, // TODO: variable
      labels: MONTH_LABELS,
      aggregateById: true,
      filterFunc: hasValue,
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: false,
      filterFunc: hasValue,
      values: Array.from(Set(data.map(d => d.get('year'))).values()).sort(),
    },
    {
      field: 'bounds', // note: constructed field!
      internal: true,
      getValue: record => ({ lat: record.get('lat'), lon: record.get('lon') }),

      // TODO: use rbush or spatial filter?
      filterFunc: boundsFilterFunc,
    },
  ]
  const visibleFilters = filters.filter(({ internal }) => !internal)

  return (
    <Layout title={`${commonName} (${sciName})`}>
      <Wrapper>
        <CrossfilterProvider
          data={data}
          filters={filters}
          valueField={valueField}
        >
          <Sidebar>
            {selected.features.size > 0 ? (
              <DetectorDetails species={species} detectors={selected.features} onSetDetector={handleSetFeature} onClose={handleDetailsClose}></DetectorDetails>
            ) : (
              <>
                <Header>
                  <CommonName>{commonName}</CommonName>
                  <ScientificName>{sciName}</ScientificName>
                </Header>

                <Stats>
                  <Column>
                    {formatNumber(totalDetections, 0)} detections
                    <br />
                    {formatNumber(totalNights, 0)} nights
                  </Column>
                  <RightColumn>
                    {totalDetectors} detectors
                    <br />
                    {contributors ? (
                      <>
                        {contributors.length}{' '}
                        {contributors.length === 1
                          ? 'contributor'
                          : 'contributors'}
                      </>
                    ) : null}
                  </RightColumn>
                </Stats>
                <Box m="1rem">
                  <Switch
                    label="filter detectors by map extent?"
                    enabled={filterByBounds}
                    onChange={handleToggleBoundsFilter}
                  />
                </Box>

                <Box my="1rem">
                  <ValueFieldSelector fields={['detections', 'nights', 'id']} />
                </Box>

                <Box my="1rem">
                  <TimePlayer
                    timesteps={MONTHS}
                    timestepLabels={MONTH_LABELS}
                  />
                </Box>

                <FiltersList filters={visibleFilters} />
              </>
            )}
          </Sidebar>
          <Map
            filterByBounds={filterByBounds}
            detectors={detectors}
            species={species}
            // selectedFeatures={selectedFeatures}
            selectedFeature={selected.feature}
            onSelectFeatures={handleSelectFeatures}
          />
        </CrossfilterProvider>
      </Wrapper>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {
  data: PropTypes.shape({
    speciesJson: PropTypes.shape({
      species: PropTypes.string.isRequired,
      commonName: PropTypes.string.isRequired,
      sciName: PropTypes.string.isRequired,
      detections: PropTypes.number.isRequired,
      nights: PropTypes.number.isRequired,
      detectors: PropTypes.number.isRequired,
      contributors: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    allDetectorsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        lat: PropTypes.number.isRequired,
        lon: PropTypes.number.isRequired,
        micHt: PropTypes.number.isRequired,
        micType: PropTypes.string,
        reflType: PropTypes.string,
        mfg: PropTypes.string,
        model: PropTypes.string,
callId: PropTypes.arrayOf(PropTypes.string),
datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  query SpeciesPageQuery($species: String!) {
    speciesJson(species: { eq: $species }) {
      species
      commonName
      sciName
      detections
      nights
      detectors
      contributors
    }
    allDetectorsJson(filter: { speciesPresent: { eq: $species } }) {
      edges {
        node {
          id: detector
          name
          lat
          lon
          micHt
          micType
          reflType
          mfg
          model
          callId
          datasets
          contributors
          admin1
          admin1Name
          country
        }
      }
    }
    allDetectorTsJson {
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
    allAdmin1SpeciesTsJson(filter: { s: { eq: $species } }) {
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

// (filter: { s: { eq: $species } })


export default SpeciesTemplate
