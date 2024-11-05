import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Spinner, Text } from 'theme-ui'
import { useQuery } from '@tanstack/react-query'
import { op } from 'arquero'

import { Layout, PageErrorMessage, SEO } from 'components/Layout'
import {
  Provider as CrossfilterProvider,
  ValueFieldSelector,
} from 'components/Crossfilter'

import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import SpeciesFilters from 'components/SpeciesFilters'
import { Map } from 'components/Species'
import { MONTHS, MONTH_LABELS, SPECIES, H3_COLS } from 'config'
import { fetchFeather } from 'data'
import { indexBy } from 'util/data'

const loadData = async (species) => {
  const [detectorsTable, rawSpeciesTable] = await Promise.all([
    fetchFeather('/data/detectors.feather'),
    fetchFeather(`/data/species/${species}.feather`),
  ])

  const speciesTable = rawSpeciesTable.join(
    detectorsTable.select([
      'id',
      'siteId',
      'admin1Name',
      'countType',
      ...H3_COLS,
    ]),
    ['detId', 'id']
  )

  const { admin1Name: admin1Names, year: years } = speciesTable
    .rollup({
      admin1Name: op.array_agg_distinct('admin1Name'),
      year: op.array_agg_distinct('year'),
    })
    .objects()[0]

  admin1Names.sort()
  years.sort()
  console.log('admin1names', admin1Names)
  console.log('years', years)

  const filters = [
    {
      field: 'month',
      title: 'Seasonality',
      isOpen: true,
      vertical: true,
      values: MONTHS,
      labels: MONTH_LABELS.map((m) => m.slice(0, 3)),
      aggregateById: true,
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: true,
      vertical: true,
      values: years,
      labels:
        years.length > 6
          ? years.map((y) => `'${y.toString().slice(2)}`)
          : years,
    },
    {
      field: 'admin1Name',
      title: 'State / Province',
      isOpen: false,
      sort: true,
      hideEmpty: true,
      values: admin1Names,
    },
    {
      field: 'countType',
      title: 'Was activity or presence monitored?',
      isOpen: false,
      values: ['p', 'a'],
      labels: ['Presence', 'Activity'],
      help: 'Some detectors monitored only the presence of a species on a given night, whereas other detectors monitored total activity during the night.',
    },
  ]

  return {
    detectorsIndex: indexBy(detectorsTable.objects(), 'id'),
    // TODO: create lookup table of detectors by siteID
    speciesTable,
    filters,
  }
}

const SpeciesTemplate = ({ pageContext: { species: selectedSpecies } }) => {
  const {
    isLoading,
    error,
    data: { detectorsIndex, speciesTable, filters } = {},
  } = useQuery({
    queryKey: [selectedSpecies],
    queryFn: async () => loadData(selectedSpecies),

    // FIXME:
    retry: false,
    staleTime: 1, // use then reload to force refresh of underlying data during dev
    // retry: true,
    // stateTime: 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const [selected, setSelected] = useState({ features: [], feature: null })

  // // use state initialization to ensure that we only process data when page mounts
  // // and not subsequent rerenders when a detector is selected
  // const {
  //   data,
  //   detectors,
  //   detectorLocations,
  //   detectorTS,
  //   filters,
  //   visibleFilters,
  // } = useMemo(() => {
  //   // aggregate species data up to detector / month for this species so we can merge into detectorsTS below
  //   const grouped = groupBy(
  //     speciesTS.map(({ id, month, ...rest }) => ({
  //       id,
  //       month,
  //       ...rest,
  //       key: `${id}-${month}`,
  //     })),
  //     'key'
  //   )

  //   // sum species detection stats by month for this species
  //   const speciesMonthlyTS = Object.values(grouped).map((v) =>
  //     v.reduce(
  //       (
  //         prev,
  //         { id, species, month, detections, detectionNights, detectorNights }
  //       ) =>
  //         Object.assign(prev, {
  //           id,
  //           species,
  //           month,
  //           detections: (detections || 0) + (prev.detections || 0),
  //           detectionNights:
  //             (detectionNights || 0) + (prev.detectionNights || 0),
  //           detectorNights: (detectorNights || 0) + (prev.detectorNights || 0),
  //         }),
  //       {}
  //     )
  //   )

  //   const ts = allSpeciesTS
  //     .filter(({ species }) => species !== selectedSpecies)
  //     .concat(speciesMonthlyTS)

  //   const locations = speciesDetectors.map(
  //     ({ id, lat, lon, admin1Name, presenceOnly }) => ({
  //       id,
  //       lat,
  //       lon,
  //       admin1Name,
  //       activity: presenceOnly ? [0] : [0, 1],
  //     })
  //   )

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
      <Flex sx={{ height: '100%' }}>
        <CrossfilterProvider
          table={speciesTable}
          filters={filters}
          valueField="totalDetections"
          aggFuncs={{
            totalDetections: op.sum('detections'),
            totalDetectionNights: op.sum('detectionNights'),
            detectors: op.distinct('detId'),
          }}
        >
          <Sidebar allowScroll={false}>
            {selected.features.length > 0 ? (
              <DetectorDetails
                selectedSpecies={selectedSpecies}
                detectors={selected.features}
                // onSetDetector={handleSetFeature}
                // onClose={handleDetailsClose}
              />
            ) : (
              <SpeciesFilters species={selectedSpecies} filters={filters} />
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
              <ValueFieldSelector
                fields={['detections', 'detectionNights', 'id']}
              />
            </Flex>

            {/* <Map
                species={selectedSpecies}
                selectedFeature={selected.feature}
                // onSelectFeatures={handleSelectFeatures}
              /> */}
          </Box>
        </CrossfilterProvider>
      </Flex>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {
  pageContext: PropTypes.shape({
    species: PropTypes.string.isRequired,
  }).isRequired,
}

export default SpeciesTemplate

/* eslint-disable-next-line react/prop-types */
export const Head = ({ pageContext: { species: selectedSpecies } }) => {
  const { commonName, sciName } = SPECIES[selectedSpecies]

  return <SEO title={`${commonName} (${sciName})`} />
}
