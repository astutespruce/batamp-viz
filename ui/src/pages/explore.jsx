import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { List, Set, fromJS } from 'immutable'

import FiltersList from 'components/FiltersList'
import { Switch } from 'components/Form'
import Layout from 'components/Layout'
import { Text, HelpText } from 'components/Text'
import {
  hasValue,
  Provider as CrossfilterProvider,
  FilteredMap as Map,
} from 'components/Crossfilter'
import Sidebar, { SidebarHeader } from 'components/Sidebar'
import { withinBounds } from 'components/Map/util'
import { Flex, Box } from 'components/Grid'
import styled, { themeGet } from 'style'
import { createIndex } from 'util/data'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import { MONTHS, MONTH_LABELS } from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
`

const Help = styled(HelpText).attrs({ mx: '1rem', mb: '1rem' })``

const ExplorePage = ({
  data: { allDetectorsJson, allDetectorTsJson, allSpeciesJson },
}) => {
  const [filterByBounds, setFilterByBounds] = useState(true)

  const handleToggleBoundsFilter = () => {
    setFilterByBounds(prev => !prev)
  }


  const allSpecies = extractNodes(allSpeciesJson)
  const detectors = fromJS(extractNodes(allDetectorsJson))
  const detectorIndex = createIndex(detectors, 'id')

  // join detector locations to detector occurrences by species and timestamp
  const data = fromJS(
    extractNodes(allDetectorTsJson).map(d => {
      const detector = detectorIndex.get(d.id)
      return {
        occurrences: 1, // each record is an occurrence for this timestep / species
        lat: detector.get('lat'),
        lon: detector.get('lon'),
        ...d,
      }
    })
  )

  const years = Array.from(Set(data.map(d => d.get('year'))).values()).sort()
  const valueField = 'occurrences'

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
      field: 'species',
      title: 'Species Detected',
      isOpen: true,
      hideEmpty: true,
      filterFunc: hasValue,
      sort: true,
      values: allSpecies.map(({ species: spp }) => spp),
      labels: allSpecies.map(
        ({ commonName, sciName }) => `${commonName} (${sciName})`
      ),
    },
    {
      field: 'month',
      title: 'Month',
      isOpen: false,
      filterFunc: hasValue,
      values: MONTHS,
      labels: MONTH_LABELS,
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: false,
      filterFunc: hasValue,
      values: years,
    },
  ]

  // filter out internal filters
  const visibleFilters = filters.filter(({ internal }) => !internal)

  return (
    <Layout title="Explore Species Occurrences">
      <Wrapper>
        <CrossfilterProvider
          data={data}
          filters={filters}
          valueField={valueField}
        >
          <Sidebar allowScroll={false}>
            <Box flex={0}>
              <SidebarHeader title="Species Occurrences" icon="slidersH" />
              <Help>An occurrence is anytime a species was detected by an acoustic detector at a given location for a given month and year.  Use the following filters to select specific species or time periods that you are interested in.</Help>
            </Box>

            {/* <Box m="1rem">
              <Switch
                label="filter occurrences by map extent?"
                enabled={filterByBounds}
                onChange={handleToggleBoundsFilter}
              />
            </Box> */}

            <FiltersList filters={visibleFilters} />
          </Sidebar>
          <Map detectors={detectors} filterByBounds={filterByBounds} />
        </CrossfilterProvider>
      </Wrapper>
    </Layout>
  )
}

ExplorePage.propTypes = {
  data: PropTypes.shape({
    allDetectorsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        lat: PropTypes.number.isRequired,
        lon: PropTypes.number.isRequired,
        // species: PropTypes.arrayOf(PropTypes.string).isRequired,
      })
    ).isRequired,
    allDetectorTsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        species: PropTypes.string.isRequired,
        year: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired,
      })
    ),
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
