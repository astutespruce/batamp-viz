import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex } from 'theme-ui'

import { ClientOnly, Layout, SEO } from 'components/Layout'
import {
  Provider as CrossfilterProvider,
  FilteredMap as Map,
  ValueFieldSelector,
} from 'components/Crossfilter'

import Sidebar from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import SpeciesFilters from 'components/SpeciesFilters'
import { join, groupBy } from 'util/data'
import { useDetectors, useSpeciesTS } from 'data'
import { MONTHS, MONTH_LABELS, SPECIES } from '../../config/constants'

const SpeciesTemplate = ({ pageContext: { species: selectedSpecies } }) => {
  const [selected, setSelected] = useState({ features: [], feature: null })

  const speciesDetectors = useDetectors().filter(
    ({ targetSpecies }) => targetSpecies.indexOf(selectedSpecies) !== -1
  )
  const allSpeciesTS = useSpeciesTS()
  const speciesTS = allSpeciesTS.filter(
    ({ species }) => species === selectedSpecies
  )

  // use state initialization to ensure that we only process data when page mounts
  // and not subsequent rerenders when a detector is selected
  const {
    data,
    detectors,
    detectorLocations,
    detectorTS,
    filters,
    visibleFilters,
  } = useMemo(() => {
    // aggregate species data up to detector / month for this species so we can merge into detectorsTS below
    const grouped = groupBy(
      speciesTS.map(({ id, month, ...rest }) => ({
        id,
        month,
        ...rest,
        key: `${id}-${month}`,
      })),
      'key'
    )

    // sum species detection stats by month for this species
    const speciesMonthlyTS = Object.values(grouped).map((v) =>
      v.reduce(
        (
          prev,
          { id, species, month, detections, detectionNights, detectorNights }
        ) =>
          Object.assign(prev, {
            id,
            species,
            month,
            detections: (detections || 0) + (prev.detections || 0),
            detectionNights:
              (detectionNights || 0) + (prev.detectionNights || 0),
            detectorNights: (detectorNights || 0) + (prev.detectorNights || 0),
          }),
        {}
      )
    )

    const ts = allSpeciesTS
      .filter(({ species }) => species !== selectedSpecies)
      .concat(speciesMonthlyTS)

    const locations = speciesDetectors.map(
      ({ id, lat, lon, admin1Name, presenceOnly }) => ({
        id,
        lat,
        lon,
        admin1Name,
        activity: presenceOnly ? [0] : [0, 1],
      })
    )

    const initData = join(speciesTS, locations, 'id')

    // data for filter values
    const years = Array.from(new Set(initData.map(({ year }) => year))).sort()

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
        values: Array.from(new Set(initData.map((d) => d.admin1Name))).sort(),
      },
      {
        field: 'activity',
        title: 'Was activity or presence monitored?',
        isOpen: false,
        isArray: true,
        values: [0, 1],
        labels: ['Presence', 'Activity'],
        help: 'Some detectors monitored only the presence of a species on a given night, whereas other detectors monitored total activity during the night.',
      },
    ]

    return {
      data: initData,
      detectors: speciesDetectors,
      detectorLocations: locations,
      detectorTS: ts,
      filters: initFilters,
      visibleFilters: initFilters.filter(({ internal }) => !internal),
    }
  }, [])

  const handleSelectFeatures = (ids) => {
    const features = detectors
      .filter(({ id }) => ids.has(id))
      .map((d) => ({
        ...d,
        ts: detectorTS.filter(({ id }) => id === d.id),
      }))

    console.log('selected features', features)

    setSelected({
      features,
      feature: features.length ? features[0].id : null,
    })
  }

  const handleSetFeature = (feature) => {
    setSelected({
      features: selected.features,
      feature,
    })
  }

  const handleDetailsClose = () => {
    setSelected({ features: [], feature: null })
  }

  return (
    <Layout>
      <ClientOnly>
        <Flex sx={{ height: '100%' }}>
          <CrossfilterProvider
            data={data}
            filters={filters}
            options={{ valueField: 'detections' }}
          >
            <Sidebar allowScroll={false}>
              {selected.features.length > 0 ? (
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

            <Box
              sx={{ position: 'relative', flex: '1 0 auto', height: '100%' }}
            >
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

              <Map
                detectors={detectorLocations}
                species={selectedSpecies}
                selectedFeature={selected.feature}
                onSelectFeatures={handleSelectFeatures}
              />
            </Box>
          </CrossfilterProvider>
        </Flex>
      </ClientOnly>
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
