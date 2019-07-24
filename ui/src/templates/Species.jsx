import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from 'components/Layout'
import {
  Provider as CrossfilterProvider,
  FilteredMap as Map,
  ValueFieldSelector,
} from 'components/Crossfilter'

import Sidebar from 'components/Sidebar'
import { Flex } from 'components/Grid'
import DetectorDetails from 'components/DetectorDetails'
import styled from 'style'
import { GraphQLArrayPropType, extractNodes } from 'util/graphql'
import TopBar from 'components/Map/TopBar'
import SpeciesFilters from 'components/SpeciesFilters'
import { join, extractDetectors, groupBy } from 'util/data'
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

const SpeciesTemplate = ({
  pageContext: {species: selectedSpecies},
  data: { speciesJson, allSpeciesTsJson, allDetectorsJson, allDetectorTsJson },
}) => {
  const { commonName, sciName } = SPECIES[selectedSpecies]

  const [selected, setSelected] = useState({ features: [], feature: null })

  // use state initialization to ensure that we only process data when page mounts
  // and not subsequent rerenders when a detector is selected
  const [
    { data, detectors, detectorLocations, detectorTS, filters, visibleFilters },
  ] = useState(() => {
    const speciesTS = extractNodes(allSpeciesTsJson).map(
      ({
        id,
        y: year,
        m: month,
        dn: detectorNights,
        dtn: detectionNights,
        dt: detections,
      }) => ({
        id,
        species: selectedSpecies,
        year,
        month,
        detectorNights,
        detectionNights,
        detections,
      })
    )

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
    const speciesMonthlyTS = Object.values(grouped).map(v =>
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

    const ts = extractNodes(allDetectorTsJson)
      .map(
        ({
          id,
          s: speciesId,
          m: month,
          dn: detectorNights,
          dtn: detectionNights,
          dt: detections,
        }) => ({
          id,
          species: SPECIES_ID[speciesId],
          month,
          detectorNights,
          detectionNights,
          detections,
        })
      )
      .concat(speciesMonthlyTS)

    const initDetectors = extractDetectors(allDetectorsJson)
    const locations = initDetectors.map(
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
        labels: MONTH_LABELS.map(m => m.slice(0, 3)),
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
      {
        field: 'activity',
        title: 'Was activity or presence monitored?',
        isOpen: false,
        isArray: true,
        values: [0, 1],
        labels: ['Presence', 'Activity'],
        help:
          'Some detectors monitored only the presence of a species on a given night, whereas other detectors monitored total activity during the night.',
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
    <Layout title={`${commonName} (${sciName})`}>
      <Wrapper>
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

          <MapContainer>
            <TopBar>
              <ValueFieldSelector
                fields={['detections', 'detectionNights', 'id']}
              />
            </TopBar>

            <Map
              detectors={detectorLocations}
              species={selectedSpecies}
              selectedFeature={selected.feature}
              onSelectFeatures={handleSelectFeatures}
            />
          </MapContainer>
        </CrossfilterProvider>
      </Wrapper>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {
  data: PropTypes.shape({
    allDetectorsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        lat: PropTypes.number.isRequired,
        lon: PropTypes.number.isRequired,
        ad1: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        ad1n: PropTypes.string.isRequired,
        mh: PropTypes.number.isRequired,
        mt: PropTypes.string,
        rt: PropTypes.string,
        mf: PropTypes.string,
        mo: PropTypes.string,
        ci: PropTypes.string,
        po: PropTypes.number,
        ds: PropTypes.arrayOf(PropTypes.string).isRequired,
        co: PropTypes.string.isRequired,
        sp: PropTypes.arrayOf(PropTypes.number),
        st: PropTypes.arrayOf(PropTypes.number),
        dt: PropTypes.number.isRequired,
        dn: PropTypes.number.isRequired,
        dtn: PropTypes.number.isRequired,
        dr: PropTypes.string.isRequired,
        y: PropTypes.number.isRequired,
      })
    ).isRequired,
    allSpeciesTsJson: GraphQLArrayPropType(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        m: PropTypes.number.isRequired,
        dn: PropTypes.number.isRequired,
        dtn: PropTypes.number.isRequired,
        dt: PropTypes.number.isRequired,
      })
    ).isRequired,
    allDetectorTsJson: GraphQLArrayPropType(
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
  query SpeciesPageQuery($speciesId: Int!) {
    allDetectorsJson(filter: { st: { eq: $speciesId } }) {
      edges {
        node {
          id: i
          name
          lat
          lon
          mh
          mt
          rt
          mf
          mo
          ci
          ds
          co
          ad1
          ad1n
          ad0
          dt
          dtn
          dn
          dr
          sp
          st
          po
          y
        }
      }
    }

    allSpeciesTsJson(filter: { s: { eq: $speciesId } }) {
      edges {
        node {
          id: i
          y
          m
          dn
          dtn
          dt
        }
      }
    }

    allDetectorTsJson: allSpeciesTsJson(filter: { s: { ne: $speciesId } }) {
      edges {
        node {
          id: i
          s
          m
          dtn
          dt
        }
      }
    }
  }
`

export default SpeciesTemplate
