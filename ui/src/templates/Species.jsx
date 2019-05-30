import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { List, fromJS, Set } from 'immutable'

import Layout from 'components/Layout'
import { Text } from 'components/Text'
import {
  hasValue,
  Provider as CrossfilterProvider,
  FilteredMap as Map,
  ValueFieldSelector,
} from 'components/Crossfilter'
// import Map from 'components/Map'
import Sidebar from 'components/Sidebar'
import { Box, Column, Columns, Flex } from 'components/Grid'
import FiltersList from 'components/FiltersList'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import { createIndex, filterIndex } from 'util/data'
import { NABounds, MONTHS } from '../../config/constants'

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

const filters = [
  {
    field: 'id',
    internal: true,
    filterFunc: hasValue,
  },
  {
    field: 'timestep',
    title: 'Month', // TODO: variable
    isOpen: true,
    values: MONTHS, // TODO: variable
    filterFunc: hasValue,
  },
  {
    field: 'bounds',
    internal: true,
    aggregate: false,

    filterFunc: () => () => true, // FIXME!
    // TODO: use rbush or spatial filter?
  },
]

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
  },
}) => {
  const [valueField, setValueField] = useState('detections')

  const detectors = fromJS(extractNodes(allDetectorsJson))

  // Note: only adding detectors field to detectors, will come in with data for other units
  const data = fromJS(
    extractNodes(allDetectorTsJson).map(d => ({ detectors: 1, ...d }))
  )

  // console.log('ts', data.toJS())

  // const timestepField = 'month'
  // const valueField = 'detections' // one of detectors, detections,

  // TODO: this could migrate to server tier too
  // const data = fromJS(
  //   ts.map(({ unitID, [timestepField]: timestep, [valueField]: value }) => ({
  //     unitID,
  //     timestep,
  //     value,
  //   }))
  // )

  // const index = createIndex(detectors, 'detector')

  // const [selectedId, setSelectedId] = useState(null)
  // const boundsRef = useRef(NABounds) // store bounds so they are updated without rerendering
  // const [{ prevBounds, nextBounds }, setBounds] = useState({
  //   prevBounds: List(NABounds),
  // })

  // const handleSelect = id => {
  //   console.log('onSelect', id)
  //   setSelectedId(id)
  // }

  // const handleBoundsChange = bounds => {
  //   boundsRef.current = bounds
  // }

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
                    {contributors.length === 1 ? 'contributor' : 'contributors'}
                  </>
                ) : null}
              </RightColumn>
            </Stats>

            <Box my="1rem">
              <ValueFieldSelector
                fields={['detections', 'nights', 'id']}
              />
            </Box>

            <FiltersList filters={visibleFilters} />
          </Sidebar>
          <Map
          detectors={detectors}
            // bounds={nextBounds}
            // selectedFeature={selectedId}
            // onSelectFeature={handleSelect}
            // onBoundsChange={handleBoundsChange}
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
          lat
          lon
        }
      }
    }
    allDetectorTsJson(filter: { s: { eq: $species } }) {
      edges {
        node {
          id: i
          timestep: m
          detections: d
          nights: n
        }
      }
    }
  }
`

export default SpeciesTemplate
