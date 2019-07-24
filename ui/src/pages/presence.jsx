import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

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
import styled from 'style'
import { join, extractDetectors } from 'util/data'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import {
  MONTHS,
  MONTH_LABELS,
  SPECIES,
  SPECIES_ID,
} from '../../config/constants'

const Wrapper = styled(Flex)`
  height: 100%;
`

const MapContainer = styled.div`
  position: relative;
  flex: 1 0 auto;
  height: 100%;
`

const HelpText = styled(BaseHelpText).attrs({ mx: '1rem', mb: '1rem' })``

const PresencePage = ({ data: { allDetectorsJson, allSpeciesTsJson } }) => {
  const [selected, setSelected] = useState({ features: [], feature: null })

  // use state initialization to ensure that we only process data when page mounts
  // and not subsequent rerenders when a detector is selected
  const [
    { data, detectors, detectorLocations, detectorTS, filters, visibleFilters },
  ] = useState(() => {
    const ts = extractNodes(allSpeciesTsJson).map(
      ({
        id,
        s: speciesId,
        y: year,
        m: month,
        dtn: detectionNights,
        dt: detections,
      }) => ({
        id,
        species: SPECIES_ID[speciesId],
        year,
        month,
        detectionNights,
        detections,
      })
    )

    const initDetectors = extractDetectors(allDetectorsJson)
    const locations = initDetectors.map(({ id, lat, lon, admin1Name }) => ({
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
        labels: MONTH_LABELS.map(m => m.slice(0, 3)),
      },
      {
        field: 'year',
        title: 'Year',
        isOpen: false,
        vertical: true,
        values: years,
        labels:
          years.length > 6
            ? years.map(y => `'${y.toString().slice(2)}`)
            : years,
      },
      {
        field: 'admin1Name',
        title: 'State / Province',
        isOpen: false,
        sort: true,
        hideEmpty: true,
        values: Array.from(new Set(initData.map(d => d.admin1Name))).sort(),
      },
    ]

    return {
      data: initData,
      detectors: initDetectors,
      detectorLocations: locations,
      detectorTS: ts,
      filters: initFilters,
      visibleFilters: initFilters.filter(({ internal }) => !internal),
    }
  })

  const handleSelectFeatures = ids => {
    const features = detectors
      .filter(({ id }) => ids.has(id))
      .map(d => ({
        ...d,
        ts: detectorTS.filter(({ id }) => id === d.id),
      }))

    console.log('selected features', features)

    setSelected({
      features,
      feature: features.length ? features[0].id : null,
    })
  }

  const handleSetFeature = feature => {
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

PresencePage.propTypes = {
  data: PropTypes.shape({
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
        presenceOnly: PropTypes.number,
        datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
        contributors: PropTypes.string.isRequired,
        species: PropTypes.arrayOf(PropTypes.string),
        targetSpecies: PropTypes.arrayOf(PropTypes.string),
        detections: PropTypes.number.isRequired,
        detectorNights: PropTypes.number.isRequired,
        detectionNights: PropTypes.number.isRequired,
        dateRange: PropTypes.string.isRequired,
        years: PropTypes.number.isRequired,
      })
    ).isRequired,
    allSpeciesTsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        s: PropTypes.number.isRequired,
        m: PropTypes.number.isRequired,
        dtn: PropTypes.number.isRequired,
        dt: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query PresencePageQuery {
    allDetectorsJson {
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
          presenceOnly: po
          years
        }
      }
    }
    allSpeciesTsJson {
      edges {
        node {
          id: i
          s
          y
          m
          dtn
          dt
        }
      }
    }
  }
`

export default PresencePage
