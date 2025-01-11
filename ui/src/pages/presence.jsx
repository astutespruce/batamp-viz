import React, { useRef, useState } from 'react'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { op } from 'arquero'

import { Layout, PageErrorMessage, SEO } from 'components/Layout'

import { Provider as CrossfilterProvider } from 'components/Crossfilter'
import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { loadOccurrenceData } from 'api'
import { Map, PresenceFilters } from 'components/SpeciesPresence'

const PresencePage = () => {
  const mapRef = useRef(null)

  const {
    isLoading,
    error,
    data: { detectorsBySite, allSpeciesTable, filters } = {},
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
      <Flex sx={{ height: '100%', width: '100%' }}>
        <CrossfilterProvider
          table={allSpeciesTable}
          filters={filters}
          valueField="speciesCount"
          aggFuncs={{ speciesCount: op.distinct('species') }}
          // for dimensions and totals, only aggregate records where species is detected
          preFilter={(d) => d.detections > 0}
        >
          <Sidebar allowScroll={false}>
            {selectedDetectors.length > 0 ? (
              <DetectorDetails
                table={allSpeciesTable}
                detectors={selectedDetectors}
                map={mapRef.current}
                onClose={handleDetailsClose}
              />
            ) : (
              <PresenceFilters filters={filters} />
            )}
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
