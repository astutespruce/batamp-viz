import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { List, fromJS } from 'immutable'

import FiltersList from 'components/FiltersList'
import Layout from 'components/Layout'
import { Text, HelpText } from 'components/Text'
import {
  hasValue,
  Provider as CrossfilterProvider,
  FilteredMap as Map,
} from 'components/Crossfilter'
// import Map from 'components/Map'
import Sidebar, { SidebarHeader } from 'components/Sidebar'
import { withinBounds } from 'components/Map/util'
import { Flex, Box } from 'components/Grid'
import styled, { themeGet } from 'style'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'

const Wrapper = styled(Flex)`
  height: 100%;
`

const Help = styled(HelpText).attrs({ mx: '1rem', mb: '1rem' })``

const ExplorePage = ({ data: { allDetectorsJson, allSpeciesJson } }) => {
  const species = extractNodes(allSpeciesJson)

  const valueField = 'detections'

  const filters = [
    {
      field: 'id',
      internal: true,
      filterFunc: hasValue,
    },
    {
      field: 'bounds', // note: constructed field!
      internal: true,
      getValue: record => ({ lat: record.get('lat'), lon: record.get('lon') }),

      // TODO: use rbush or spatial filter?
      filterFunc: mapBounds => ({ lat, lon }) =>
        withinBounds({ lat, lon }, mapBounds),
    },
    {
      field: 'speciesPresent',
      title: 'Species Detected',
      isOpen: true,
      hideEmpty: true,
      filterFunc: hasValue,
      sortByCount: true,
      isArray: true,
      values: species.map(({ species: spp }) => spp),
      labels: species.map(
        ({ commonName, sciName }) => `${commonName} (${sciName})`
      ),
    },
  ]

  const detectors = fromJS(extractNodes(allDetectorsJson))
  const data = detectors

  // filter out internal filters
  const visibleFilters = filters.filter(({ internal }) => !internal)

  return (
    <Layout title="Explore data">
      <Wrapper>
        <CrossfilterProvider
          data={data}
          filters={filters}
          valueField={valueField}
        >
          <Sidebar allowScroll={false}>
            <Box flex={0}>
              <SidebarHeader title="Explore Data" icon="slidersH" />
              <Help>Under development...</Help>
            </Box>

            <FiltersList filters={visibleFilters} />
          </Sidebar>
          <Map detectors={detectors} />
        </CrossfilterProvider>
      </Wrapper>
    </Layout>
  )
}

ExplorePage.propTypes = {
  data: PropTypes.shape({
    allDetectorsJson: GraphQLArrayPropType(
      PropTypes.shape({
        detector: PropTypes.number.isRequired,
        lat: PropTypes.number.isRequired,
        lon: PropTypes.number.isRequired,
        species_present: PropTypes.arrayOf(PropTypes.string).isRequired,
      })
    ).isRequired,
    allSpeciesJson: GraphQLArrayPropType(
      PropTypes.shape({
        species: PropTypes.string.isRequired,
        commonName: PropTypes.string.isRequired,
        sciName: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query ExplorePageQuery {
    allDetectorsJson {
      edges {
        node {
          id: detector
          lat
          lon
          speciesPresent
          detections
          nights
        }
      }
    }
    allSpeciesJson(sort: { fields: [commonName], order: ASC }) {
      edges {
        node {
          species
          commonName
          sciName
        }
      }
    }
  }
`

export default ExplorePage
