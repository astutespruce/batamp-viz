import React, { useRef, useState } from 'react'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { escape, op } from 'arquero'

import { Layout, PageErrorMessage, SEO } from 'components/Layout'

import { Provider as CrossfilterProvider } from 'components/Crossfilter'
import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import HexDetails from 'components/HexDetails'
import { loadOccurrenceData } from 'data/api'
import { Map, PresenceFilters } from 'components/SpeciesPresence'

const PresencePage = () => {
  const mapRef = useRef(null)

  const {
    isLoading,
    error,
    data: { detectorsTable, allSpeciesTable, filters } = {},
  } = useQuery({
    queryKey: ['occurrence'],
    queryFn: loadOccurrenceData,

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
      <Flex sx={{ height: '100%', width: '100%' }}>
        <CrossfilterProvider
          table={allSpeciesTable}
          filters={filters}
          valueField="speciesCount"
          aggFuncs={{ speciesCount: op.distinct('species') }}
          // for dimensions and totals, only aggregate records where species was
          // actually detected
          preFilter={(d) => d.detections > 0}
        >
          <Sidebar allowScroll={false}>
            {selectedFeature === null ? (
              <PresenceFilters filters={filters} />
            ) : null}

            {selectedFeature !== null && selectedType === 'detector' ? (
              <DetectorDetails
                key={selectedFeature.id}
                siteId={selectedFeature.id}
                table={allSpeciesTable}
                detectorsTable={detectorsTable}
                map={mapRef.current}
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
                onClose={handleDetailsClose}
              />
            ) : null}
          </Sidebar>

          <Box sx={{ position: 'relative', flex: '1 0 auto', height: '100%' }}>
            <Map
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

export default PresencePage

export const Head = () => <SEO title="Explore Species Occurrences" />
