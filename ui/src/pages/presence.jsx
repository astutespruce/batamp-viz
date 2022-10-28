import React, { useMemo, useState } from 'react'

import FiltersList from 'components/FiltersList'
import Layout from 'components/Layout'
import { HelpText as BaseHelpText, ExpandableParagraph } from 'components/Text'
import {
  Provider as CrossfilterProvider,
  FilteredMap as Map,
} from 'components/Crossfilter'
import Sidebar, { SidebarHeader } from 'components/Sidebar'
import DetectorDetails from 'components/DetectorDetails'
import { Flex, Box } from 'components/Grid'
import { useDetectors, useSpeciesTS } from 'data'
import styled from 'style'
import { join } from 'util/data'
import { MONTHS, MONTH_LABELS, SPECIES } from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
  width: 100%;
`

const MapContainer = styled.div`
  position: relative;
  flex: 1 0 auto;
  height: 100%;
`

const HelpText = styled(BaseHelpText).attrs({ mx: '1rem', mb: '1rem' })``

const PresencePage = () => {
  const [selected, setSelected] = useState({ features: [], feature: null })

  const detectors = useDetectors()
  const allSpeciesTS = useSpeciesTS()

  // use state initialization to ensure that we only process data when page mounts
  // and not subsequent rerenders when a detector is selected
  const { data, detectorLocations, detectorTS, filters, visibleFilters } =
    useMemo(() => {
      // drop unneeded fields
      const ts = allSpeciesTS.map(
        ({ id, species, year, month, detectionNights, detections }) => ({
          id,
          species,
          year,
          month,
          detectionNights,
          detections,
        })
      )

      const locations = detectors.map(({ id, lat, lon, admin1Name }) => ({
        id,
        lat,
        lon,
        admin1Name,
      }))

      const initData = join(ts, locations, 'id')

      // data for filter values
      const allSpecies = Object.entries(SPECIES).map(([species, v]) => ({
        species,
        ...v,
      }))

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
          labels: MONTH_LABELS.map((m) => m.slice(0, 3)),
        },
        {
          field: 'year',
          title: 'Year',
          isOpen: false,
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
      ]

      return {
        data: initData,
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
    <Layout title="Explore Species Occurrences">
      <Wrapper>
        <CrossfilterProvider
          data={data}
          filters={filters}
          options={{ valueField: 'species' }}
        >
          <Sidebar allowScroll={false}>
            {selected.features.length > 0 ? (
              <DetectorDetails
                detectors={selected.features}
                onSetDetector={handleSetFeature}
                onClose={handleDetailsClose}
              />
            ) : (
              <>
                <Box flex="0 0 auto">
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

export default PresencePage
