import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { op } from 'arquero'

import { Layout, PageErrorMessage, SEO } from 'components/Layout'
import {
  Provider as CrossfilterProvider,
  ValueFieldSelector,
} from 'components/Crossfilter'

import { loadSingleSpeciesData } from 'api'
import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { Map } from 'components/Species'
import { SPECIES } from 'config'
import SpeciesFilters from './SpeciesFilters'

const SpeciesTemplate = ({ pageContext: { speciesID } }) => {
  const mapRef = useRef(null)

  const {
    isLoading,
    error,
    data: {
      detectorsBySite,
      allSpeciesTable,
      selectedSpeciesTable,
      filters,
    } = {},
  } = useQuery({
    queryKey: [speciesID],
    queryFn: async () => loadSingleSpeciesData(speciesID),

    // retry: false,
    // staleTime: 1, // use then reload to force refresh of underlying data during dev
    retry: true,
    stateTime: 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const [{ selectedFeature, selectedDetectors }, setState] = useState({
    selectedFeature: null,
    selectedDetectors: [],
  })

  const handleSelectFeature = (feature) => {
    console.log('select', feature)
    if (feature === null) {
      setState(() => ({
        selectedFeature: null,
        selectedDetectors: [],
      }))
    } else if (feature.sourceLayer === 'sites') {
      setState(() => ({
        selectedFeature: feature,
        selectedDetectors: detectorsBySite[feature.id],
      }))
    }
    // TODO: hexes
  }

  const handleDetailsClose = () => {
    setState(() => ({
      selectedFeature: null,
      selectedDetectors: [],
    }))
  }

  const handleCreateMap = (map) => {
    mapRef.current = map
  }

  if (isLoading) {
    return (
      <Layout>
        <Flex
          sx={{
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <Spinner size="3rem" />
          <Text sx={{ fontSize: 4 }}>Loading...</Text>
        </Flex>
      </Layout>
    )
  }

  if (error) {
    console.error(error)

    return (
      <Layout>
        <PageErrorMessage />
      </Layout>
    )
  }

  return (
    <Layout>
      <Flex sx={{ height: '100%' }}>
        <CrossfilterProvider
          table={selectedSpeciesTable}
          filters={filters}
          valueField="detections"
          aggFuncs={{
            detections: op.sum('detections'),
            detectionNights: op.sum('detectionNights'),
            detectors: op.distinct('detId'),
          }}
        >
          <Sidebar allowScroll={false}>
            {selectedDetectors.length > 0 ? (
              <DetectorDetails
                table={allSpeciesTable}
                speciesID={speciesID}
                detectors={selectedDetectors}
                map={mapRef.current}
                onClose={handleDetailsClose}
              />
            ) : (
              <SpeciesFilters speciesID={speciesID} filters={filters} />
            )}
          </Sidebar>

          <Box sx={{ position: 'relative', flex: '1 0 auto', height: '100%' }}>
            <Flex
              sx={{
                p: '0.5rem',
                bg: '#FFF',
                borderRadius: '0 0 0.5rem 0.5rem',
                boxShadow: '1px 1px 8px #433c4c',
                position: 'absolute',
                zIndex: 1000,
                top: 0,
                left: '1rem',
              }}
            >
              <ValueFieldSelector />
            </Flex>

            <Map
              speciesID={speciesID}
              selectedFeature={selectedFeature}
              onSelectFeature={handleSelectFeature}
              onCreateMap={handleCreateMap}
            />
          </Box>
        </CrossfilterProvider>
      </Flex>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {
  pageContext: PropTypes.shape({
    speciesID: PropTypes.string.isRequired,
  }).isRequired,
}

export default SpeciesTemplate

/* eslint-disable-next-line react/prop-types */
export const Head = ({ pageContext: { speciesID } }) => {
  const { commonName, sciName } = SPECIES[speciesID]

  return <SEO title={`${commonName} (${sciName})`} />
}
