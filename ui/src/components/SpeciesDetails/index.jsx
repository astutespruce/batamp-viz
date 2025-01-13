import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { escape, op } from 'arquero'

import { Layout, PageErrorMessage } from 'components/Layout'
import {
  Provider as CrossfilterProvider,
  ValueFieldSelector,
} from 'components/Crossfilter'

import { loadSingleSpeciesData } from 'data/api'
import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import HexDetails from 'components/HexDetails'
import Map from './Map'
import SpeciesFilters from './SpeciesFilters'

const SpeciesDetails = ({ speciesID }) => {
  const mapRef = useRef(null)

  const {
    isLoading,
    error,
    data: {
      detectorsTable,
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

  const [{ selectedFeature, selectedType }, setState] = useState({
    selectedFeature: null,
    selectedType: null,
  })

  const handleSelectFeature = (feature) => {
    if (feature === null) {
      setState(() => ({
        selectedFeature: null,
        selectedType: null,
      }))
      return
    }

    console.log('select', feature.sourceLayer, feature.id)

    if (feature.sourceLayer === 'sites') {
      setState(() => ({
        selectedFeature: feature,
        selectedType: 'detector',
      }))
    } else if (feature.sourceLayer.startsWith('h3')) {
      setState(() => ({
        selectedFeature: feature,
        selectedType: 'hex',
      }))
    }
  }

  const handleDetailsClose = () => {
    setState(() => ({
      selectedFeature: null,
      selectedType: null,
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
            {selectedFeature === null ? (
              <SpeciesFilters speciesID={speciesID} filters={filters} />
            ) : null}

            {selectedFeature !== null && selectedType === 'detector' ? (
              <DetectorDetails
                key={selectedFeature.id}
                siteId={selectedFeature.id}
                table={allSpeciesTable}
                detectorsTable={detectorsTable}
                map={mapRef.current}
                speciesID={speciesID}
                onClose={handleDetailsClose}
              />
            ) : null}

            {selectedFeature !== null && selectedType === 'hex' ? (
              <HexDetails
                id={selectedFeature.id}
                level={selectedFeature.sourceLayer}
                // filter tables to this hex
                table={allSpeciesTable.filter(
                  escape(
                    (d) => d[selectedFeature.sourceLayer] === selectedFeature.id
                  )
                )}
                detectorsTable={detectorsTable.filter(
                  escape(
                    (d) => d[selectedFeature.sourceLayer] === selectedFeature.id
                  )
                )}
                map={mapRef.current}
                speciesID={speciesID}
                onClose={handleDetailsClose}
              />
            ) : null}
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

SpeciesDetails.propTypes = {
  speciesID: PropTypes.string.isRequired,
}

export default SpeciesDetails
