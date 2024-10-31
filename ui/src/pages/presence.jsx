import React, { useMemo, useState } from 'react'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { escape, op } from 'arquero'

import FiltersList from 'components/FiltersList'
import { ClientOnly, Layout, PageErrorMessage, SEO } from 'components/Layout'
import { ExpandableParagraph } from 'components/Text'
import { Provider as CrossfilterProvider } from 'components/Crossfilter'
import Map from 'components/Map'
import Sidebar, { SidebarHeader } from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { useDetectors, useSpeciesTS, fetchFeather } from 'data'
import { indexBy, join } from 'util/data'
import { MONTHS, MONTH_LABELS, SPECIES, SPECIES_ID, H3_COLS } from 'config'
import { filters } from 'filters/occurrence'

const occurrenceMetric = {
  key: 'species',
  label: 'species detected',
  // count unique species
  aggFunc: op.distinct('species'),
  // for dimensions and totals, only aggregate records where species is detected
  dimensionPrefilter: (d) => d.detected,
}

const loadData = async () => {
  const [detectorsTable, occurrenceTable] = await Promise.all([
    fetchFeather('/data/detectors.feather'),
    fetchFeather('/data/spp_occurrence.feather'),
  ])

  return {
    detectorsIndex: indexBy(detectorsTable.objects(), 'id'),
    occurrenceTable: occurrenceTable
      .derive({ species: escape((d) => SPECIES_ID[d.species]) })
      .join(detectorsTable.select(['id', 'siteId', 'admin1Name', ...H3_COLS]), [
        'detId',
        'id',
      ]),
  }
}

const PresencePage = () => {
  const {
    isLoading,
    error,
    data: { detectorsIndex, occurrenceTable } = {},
  } = useQuery({
    queryKey: ['data'],
    queryFn: loadData,

    // FIXME:
    retry: false,
    staleTime: 1, // use then reload to force refresh of underlying data during dev
    // retry: true,
    // stateTime: 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const [selected, setSelected] = useState({ features: [], feature: null })

  // const detectors = useDetectors()
  // const allSpeciesTS = useSpeciesTS()

  // use state initialization to ensure that we only process data when page mounts
  // and not subsequent rerenders when a detector is selected
  // const { data, detectorLocations, detectorTS, filters, visibleFilters } =
  //   useMemo(() => {
  //     // drop unneeded fields
  //     const ts = allSpeciesTS.map(
  //       ({ id, species, year, month, detectionNights, detections }) => ({
  //         id,
  //         species,
  //         year,
  //         month,
  //         detectionNights,
  //         detections,
  //       })
  //     )

  //     const locations = detectors.map(({ id, lat, lon, admin1Name }) => ({
  //       id,
  //       lat,
  //       lon,
  //       admin1Name,
  //     }))

  //     const initData = join(ts, locations, 'id')

  //     // data for filter values
  //     const allSpecies = Object.entries(SPECIES).map(([species, v]) => ({
  //       species,
  //       ...v,
  //     }))

  //     const years = Array.from(new Set(initData.map(({ year }) => year))).sort()

  //     // TODO:
  //     const initFilters = []

  //     return {
  //       data: initData,
  //       detectorLocations: locations,
  //       detectorTS: ts,
  //       filters: initFilters,
  //       visibleFilters: initFilters.filter(({ internal }) => !internal),
  //     }
  //   }, [])

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
      <ClientOnly>
        <Flex sx={{ height: '100%', width: '100%' }}>
          <CrossfilterProvider
            table={occurrenceTable}
            filters={filters}
            metric={occurrenceMetric}
            // valueField="species"
            // options={{ valueField: 'species' }}
          >
            <Sidebar allowScroll={false}>
              {selected.features.length > 0 ? (
                <DetectorDetails
                  detectors={selected.features}
                  // onSetDetector={handleSetFeature}
                  // onClose={handleDetailsClose}
                />
              ) : (
                <>
                  <Box flex="0 0 auto">
                    <SidebarHeader title="Species Occurrences" />

                    <ExpandableParagraph
                      sx={{
                        px: '1rem',
                        '& p': {
                          fontSize: 2,
                          color: 'grey.8',
                          lineHeight: 1.3,
                        },
                      }}
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
                  </Box>

                  <FiltersList filters={filters} />
                </>
              )}
            </Sidebar>

            <Box
              sx={{ position: 'relative', flex: '1 0 auto', height: '100%' }}
            >
              <Map
                // detectors={detectorLocations}
                selectedFeature={selected.feature}
                // onSelectFeatures={handleSelectFeatures}
              />
            </Box>
          </CrossfilterProvider>
        </Flex>
      </ClientOnly>
    </Layout>
  )
}

export default PresencePage

export const Head = () => <SEO title="Explore Species Occurrences" />
