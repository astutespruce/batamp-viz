import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { Set } from 'immutable'

import FiltersList from 'components/FiltersList'
import Layout from 'components/Layout'
import TopBar from 'components/Map/TopBar'
import { HelpText as BaseHelpText, ExpandableParagraph } from 'components/Text'
import {
  Provider as CrossfilterProvider,
  FilteredMap as Map,
  ValueFieldSelector,
} from 'components/Crossfilter'
import Sidebar, { SidebarHeader } from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { Flex, Box } from 'components/Grid'
import styled from 'style'
import { unpackTSData, mergeLocationIntoTS, extractDetectors } from 'util/data'
import { createIndex } from 'util/immutable'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import { MONTHS, MONTH_LABELS, SPECIES } from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
`

const MapContainer = styled.div`
  position: relative;
  flex: 1 0 auto;
  height: 100%;
`

const HelpText = styled(BaseHelpText).attrs({ mx: '1rem', mb: '1rem' })``

const ExplorePage = ({ data: { allDetectorsJson, allDetectorTsJson } }) => {
  const [selected, setSelected] = useState({ features: Set(), feature: null })

  // use state initialization to ensure that we only process data when page mounts
  // and not subsequent rerenders when a detector is selected
  const [{
    data,
    detectorIndex,
    detectorLocations,
    detectorTS,
    filters,
    visibleFilters,
  }] = useState(() => {
    const detectors = extractDetectors(allDetectorsJson)
    const initDetectorTS = unpackTSData(extractNodes(allDetectorTsJson))

    // extract location fields for use in the map
    const initDetectorLocations = detectors.map(d =>
      d.filter((_, k) => k === 'id' || k === 'lat' || k === 'lon')
    )
    const initDetectorIndex = createIndex(detectors, 'id')
    const initData = mergeLocationIntoTS(initDetectorTS, initDetectorIndex)

    // data for filter values
    const allSpecies = Object.entries(SPECIES).map(([species, v]) => ({
      species,
      ...v,
    }))

    const years = Array.from(
      Set(initData.map(d => d.get('year'))).values()
    ).sort()

    const initFilters = [
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
          Set(initData.map(d => d.get('admin1Name'))).values()
        ).sort(),
      },
    ]

    return {
      data: initData,
      detectorIndex: initDetectorIndex,
      detectorLocations: initDetectorLocations,
      detectorTS: initDetectorTS,
      filters: initFilters,
      visibleFilters: initFilters.filter(({ internal }) => !internal),
    }
  })

  const handleSelectFeatures = ids => {
    const features = detectorIndex
      .filter((_, k) => ids.has(k))
      .toList()
      .map(d =>
        d.merge({
          ts: detectorTS.filter(v => v.get('id') === d.get('id')),
        })
      )

    console.log('selectedFeatures', features.toJS())

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

  return (
    <Layout title="Explore Species Occurrences">
      <Wrapper>
        <CrossfilterProvider
          data={data.toJS()}
          filters={filters}
          options={{ valueField: 'detectionNights' }}
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
                following filters to ..."
                    >
                      An occurrence is anytime a species was detected by an
                      acoustic detector at a given location for a given month
                      and year. Use the following filters to select specific
                      species or time periods that you are interested in.
                      Detectors are also filtered based on the extent of the
                      map.
                      <br />
                      <br />
                      You can combine filters and use multiple values for each
                      filter. For example, you can select Fringed Bat in March
                      and April.
                    </ExpandableParagraph>
                  </HelpText>
                </Box>

                <FiltersList filters={visibleFilters} />
              </>
            )}
          </Sidebar>
          <MapContainer>
            <TopBar>
              <ValueFieldSelector fields={['detectionNights', 'species']} />
            </TopBar>

            <Map
              detectors={detectorLocations}
              selectedFeature={selected.feature}
              onSelectFeatures={handleSelectFeatures}
            />
          </MapContainer>
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
