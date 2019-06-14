import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { Set } from 'immutable'

import FiltersList from 'components/FiltersList'
import Layout from 'components/Layout'
import { HelpText as BaseHelpText, ExpandableParagraph } from 'components/Text'
import {
  Provider as CrossfilterProvider,
  FilteredMap as Map,
} from 'components/Crossfilter'
import Sidebar, { SidebarHeader } from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { Flex, Box } from 'components/Grid'
import styled from 'style'
import {
  createIndex,
  unpackTSData,
  mergeLocationIntoTS,
  extractDetectors,
} from 'util/data'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import { MONTHS, MONTH_LABELS, SPECIES } from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
`

const HelpText = styled(BaseHelpText).attrs({ mx: '1rem', mb: '1rem' })``

const ExplorePage = ({ data: { allDetectorsJson, allDetectorTsJson } }) => {
  const [selected, setSelected] = useState({ features: Set(), feature: null })

  const handleSelectFeatures = ids => {
    const features = detectorIndex
      .filter((_, k) => ids.has(k))
      .toList()
      .map(d =>
        d.merge({
          ts: detectorTS.filter(v => v.get('id') === d.get('id')),
        })
      )
    setSelected({
      features,
      feature: features.size ? features.first().get('id') : null,
    })
  }

  const handleSetFeature = feature => {
    setSelected({
      features: selected.features,
      feature,
    })
  }

  const handleDetailsClose = () => {
    setSelected({ features: Set(), feature: null })
  }

  const allSpecies = Object.entries(SPECIES).map(([species, v]) => ({
    species,
    ...v,
  }))

  // TODO: memoize these
  const detectors = extractDetectors(allDetectorsJson)
  const detectorIndex = createIndex(detectors, 'id')
  const detectorTS = unpackTSData(extractNodes(allDetectorTsJson))
  const data = mergeLocationIntoTS(detectorTS, detectorIndex)

  const years = Array.from(Set(data.map(d => d.get('year'))).values()).sort()

  const valueField = 'detectionNights'

  const filters = [
    {
      field: 'lat',
      internal: true,
    },
    {
      field: 'lon',
      internal: true,
    },
    {
      field: 'species',
      title: 'Species Detected',
      isOpen: false,
      hideEmpty: true,
      sort: true,
      values: allSpecies.map(({ species: spp }) => spp),
      labels: allSpecies.map(
        ({ commonName, sciName }) => `${commonName} (${sciName})`
      ),
    },
    {
      field: 'month',
      title: 'Seasonality',
      isOpen: false,
      vertical: true,
      values: MONTHS,
      labels: MONTH_LABELS.map(m => m.slice(0, 3)),
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: false,
      vertical: true,
      values: years,
      labels: years.map(y => `'${y.toString().slice(2)}`),
    },
    {
      field: 'admin1Name',
      title: 'State / Province',
      isOpen: false,
      sort: true,
      hideEmpty: true,
      values: Array.from(
        Set(data.map(d => d.get('admin1Name'))).values()
      ).sort(),
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
          options={{ valueField }}
        >
          <Sidebar allowScroll={false}>
            {selected.features.size > 0 ? (
              <DetectorDetails
                detectors={selected.features}
                onSetDetector={handleSetFeature}
                onClose={handleDetailsClose}
              />
            ) : (
              <>
                <Box flex={0}>
                  <SidebarHeader title="Species Occurrences" icon="slidersH" />
                  <HelpText>
                    <ExpandableParagraph
                      snippet="An occurrence is anytime a species was detected by an acoustic
                detector at a given location during a given night. Use the
                following filters to select specific species or time periods
                that you are interested in."
                    >
                      An occurrence is anytime a species was detected by an
                      acoustic detector at a given location for a given month
                      and year. Use the following filters to select specific
                      species or time periods that you are interested in.
                      <br />
                      <br />
                      TODO
                    </ExpandableParagraph>
                  </HelpText>
                </Box>

                <FiltersList filters={visibleFilters} />
              </>
            )}
          </Sidebar>
          <Map
            detectors={detectors}
            selectedFeature={selected.feature}
            onSelectFeatures={handleSelectFeatures}
          />
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
        admin1Name: PropTypes.string.isRequired,
        micHt: PropTypes.number.isRequired,
        micType: PropTypes.string,
        reflType: PropTypes.string,
        mfg: PropTypes.string,
        model: PropTypes.string,
        callId: PropTypes.string,
        datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
        contributors: PropTypes.string.isRequired,
        species: PropTypes.arrayOf(PropTypes.string),
        targetSpecies: PropTypes.arrayOf(PropTypes.string),
        detections: PropTypes.number.isRequired,
        detectorNights: PropTypes.number.isRequired,
        detectionNights: PropTypes.number.isRequired,
        dateRange: PropTypes.string.isRequired,
      })
    ).isRequired,
    allDetectorTsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        speciesId: PropTypes.number.isRequired,
        timestamp: PropTypes.number.isRequired,
        value: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
}

export const pageQuery = graphql`
  query ExplorePageQuery {
    allDetectorsJson {
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
          detections
          detectorNights
          detectionNights
          dateRange
          species
          targetSpecies
        }
      }
    }
    allDetectorTsJson {
      edges {
        node {
          id: i
          speciesId: s
          timestamp: t
          value: v
        }
      }
    }
  }
`

export default ExplorePage
