import React, { useState } from 'react'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { op } from 'arquero'

import { Layout, PageErrorMessage, SEO } from 'components/Layout'

import { Provider as CrossfilterProvider } from 'components/Crossfilter'
import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { loadOccurrenceData } from 'api'
import { filters, Map, PresenceFilters } from 'components/SpeciesPresence'

const PresencePage = () => {
  const {
    isLoading,
    error,
    data: { detectorsIndex, occurrenceTable } = {},
  } = useQuery({
    queryKey: ['occurrence'],
    queryFn: loadOccurrenceData,

    // FIXME:
    retry: false,
    staleTime: 1, // use then reload to force refresh of underlying data during dev
    // retry: true,
    // stateTime: 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const [selected, setSelected] = useState({ features: [], feature: null })
  // const handleSelectFeatures = (ids) => {
  //   const features = detectors
  //     .filter(({ id }) => ids.has(id))
  //     .map((d) => ({
  //       ...d,
  //       ts: detectorTS.filter(({ id }) => id === d.id),
  //     }))

  //   console.log('selected features', features)

  //   setSelected({
  //     features,
  //     feature: features.length ? features[0].id : null,
  //   })
  // }

  // const handleSetFeature = (feature) => {
  //   setSelected({
  //     features: selected.features,
  //     feature,
  //   })
  // }

  // const handleDetailsClose = () => {
  //   setSelected({ features: [], feature: null })
  // }

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
          table={occurrenceTable}
          filters={filters}
          valueField="speciesCount"
          aggFuncs={{ speciesCount: op.distinct('species') }}
          // for dimensions and totals, only aggregate records where species is detected
          preFilter={(d) => d.detected}
        >
          <Sidebar allowScroll={false}>
            {selected.features.length > 0 ? (
              <DetectorDetails
                detectors={selected.features}
                // onSetDetector={handleSetFeature}
                // onClose={handleDetailsClose}
              />
            ) : (
              <PresenceFilters filters={filters} />
            )}
          </Sidebar>

          <Box sx={{ position: 'relative', flex: '1 0 auto', height: '100%' }}>
            <Map
              selectedFeature={selected.feature}
              // onSelectFeatures={handleSelectFeatures}
            />
          </Box>
        </CrossfilterProvider>
      </Flex>
    </Layout>
  )
}

export default PresencePage

export const Head = () => <SEO title="Explore Species Occurrences" />
