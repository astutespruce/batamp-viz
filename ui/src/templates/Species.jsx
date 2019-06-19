import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { fromJS, Set } from 'immutable'

import Layout from 'components/Layout'
import {
  Provider as CrossfilterProvider,
  FilteredMap as Map,
  ValueFieldSelector,
} from 'components/Crossfilter'

import Sidebar from 'components/Sidebar'
import { Flex } from 'components/Grid'
import DetectorDetails from 'components/DetectorDetails'
import styled from 'style'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import TopBar from 'components/Map/TopBar'
import SpeciesFilters from 'components/SpeciesFilters'
import {
  unpackTSData,
  mergeLocationIntoTS,
  extractDetectors,
} from 'util/data'
import {createIndex } from 'util/immutable'
import { MONTHS, MONTH_LABELS, SPECIES } from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
`

const MapContainer = styled.div`
  position: relative;
  flex: 1 0 auto;
  height: 100%;
`

const SpeciesTemplate = ({
  data: { speciesJson, allDetectorsJson, allDetectorTsJson },
}) => {
  const valueField = 'detections'
  const [selected, setSelected] = useState({ features: Set(), feature: null })

  const { species: selectedSpecies } = speciesJson
  const { commonName, sciName } = SPECIES[selectedSpecies]

  const detectors = extractDetectors(allDetectorsJson)
  const detectorIndex = createIndex(detectors, 'id')
  const detectorTS = unpackTSData(extractNodes(allDetectorTsJson))
  const data = mergeLocationIntoTS(
    detectorTS.filter(d => d.get('species') === selectedSpecies),
    detectorIndex
  )

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
      field: 'month',
      title: 'Seasonality',
      isOpen: true,
      vertical: true,
      values: MONTHS,
      labels: MONTH_LABELS.map(m => m.slice(0, 3)),
      aggregateById: true,
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: true,
      vertical: true,
      values: Array.from(Set(data.map(d => d.get('year'))).values()).sort(),
    },
    {
      field: 'admin1Name',
      title: 'State / Province',
      isOpen: true,
      sort: true,
      hideEmpty: true,
      values: Array.from(
        Set(data.map(d => d.get('admin1Name'))).values()
      ).sort(),
    },
  ]

  const visibleFilters = filters.filter(({ internal }) => !internal)

  return (
    <Layout title={`${commonName} (${sciName})`}>
      <Wrapper>
        <CrossfilterProvider
          data={data.toJS()}
          filters={filters}
          options={{ valueField }}
        >
          <Sidebar allowScroll={false}>
            {selected.features.size > 0 ? (
              <DetectorDetails
                selectedSpecies={selectedSpecies}
                detectors={selected.features}
                onSetDetector={handleSetFeature}
                onClose={handleDetailsClose}
              />
            ) : (
              <SpeciesFilters
                species={selectedSpecies}
                filters={visibleFilters}
              />
            )}
          </Sidebar>

          <MapContainer>
            <TopBar>
              <ValueFieldSelector
                fields={['detections', 'detectionNights', 'id']}
              />
            </TopBar>

            <Map
              detectors={detectors}
              species={selectedSpecies}
              selectedFeature={selected.feature}
              onSelectFeatures={handleSelectFeatures}
            />
          </MapContainer>
        </CrossfilterProvider>
      </Wrapper>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {
  data: PropTypes.shape({
    speciesJson: PropTypes.shape({
      species: PropTypes.string.isRequired,
      detections: PropTypes.number.isRequired,
      detectionNights: PropTypes.number.isRequired,
      detectors: PropTypes.number.isRequired,
      contributors: PropTypes.number.isRequired,
    }).isRequired,
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
    ).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query SpeciesPageQuery($species: String!) {
    speciesJson(species: { eq: $species }) {
      species
      detections
      detectionNights
      detectors
      contributors
    }

    allDetectorsJson(filter: { targetSpecies: { eq: $species } }) {
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

export default SpeciesTemplate
