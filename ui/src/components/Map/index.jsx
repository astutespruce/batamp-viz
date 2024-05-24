/* eslint-disable max-len,no-underscore-dangle,camelcase */
import React, { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDebouncedCallback } from 'use-debounce'
import { Box } from 'theme-ui'
import { PmTilesSource } from 'mapbox-pmtiles/dist/mapbox-pmtiles'

// exclude Mapbox GL from babel transpilation per https://docs.mapbox.com/mapbox-gl-js/guides/migrate-to-v2/
/* eslint-disable-next-line */
import mapboxgl from '!mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { formatNumber, quantityLabel } from 'util/format'
import { niceNumber, difference, clone } from 'util/data'
import { useIsEqualEffect } from 'util/hooks'

import StyleSelector from './StyleSelector'
import Legend from './Legend'
import {
  getCenterAndZoom,
  toGeoJSONPoints,
  calculateBounds,
  interpolateExpr,
  maxProperty,
} from './util'
import {
  config,
  sources,
  layers,
  legends,
  speciesSource,
  speciesLayers,
  MINRADIUS,
  MAXRADIUS,
  NONDETECTIONCOLOR,
  LIGHTESTCOLOR,
  DARKESTCOLOR,
} from './config'
import { METRIC_LABELS, SPECIES } from '../../../config/constants'

const Map = ({
  detectors,
  valueField,
  maxValue,
  selectedFeature,
  bounds,
  species,
  hasFilters,
  onSelectFeatures,
  onBoundsChange,
}) => {
  const { accessToken, styles } = config

  // Use refs to coordinate values set after map is constructed
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const baseStyleRef = useRef(null)
  const selectedFeatureRef = useRef(selectedFeature)
  const highlightFeatureRef = useRef(new Set())
  const valueFieldRef = useRef(valueField)
  const hasFilterRef = useRef(hasFilters)
  const detectorsRef = useRef(detectors)

  const [legendEntries, setLegendEntries] = useState(
    species ? legends.species() : []
  )

  // Debounce calls to set style & legend, since these may be called frequently during panning or changing data
  const styleDetectors = useDebouncedCallback(
    (calculateMax) => styleDetectorsImpl(calculateMax),
    100
  )

  useEffect(() => {
    // set initial references to variables that update
    valueFieldRef.current = valueField

    const { padding, bounds: initBounds } = config
    let { center, zoom } = config

    const targetBounds = bounds && bounds.length ? initBounds : bounds

    // If bounds are available, use these to establish center and zoom when map first loads
    if (targetBounds && targetBounds.length === 4) {
      const {
        current: { offsetWidth, offsetHeight },
      } = mapNode

      const { center: boundsCenter, zoom: boundsZoom } = getCenterAndZoom(
        targetBounds,
        offsetWidth,
        offsetHeight,
        padding
      )
      center = boundsCenter
      zoom = boundsZoom
    }

    mapboxgl.accessToken = accessToken
    mapboxgl.Style.setSourceType(PmTilesSource.SOURCE_TYPE, PmTilesSource)

    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: `mapbox://styles/mapbox/${styles[0]}`,
      center: center || [0, 0],
      zoom: zoom || 0,
      minZoom: config.minZoom || 0,
    })
    mapRef.current = map
    window.map = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // show tooltip on hover
    const tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'left',
      offset: 20,
    })

    // Construct GeoJSON points from detector locations
    sources.detectors.data = toGeoJSONPoints(detectors)

    map.on('load', () => {
      // snapshot existing map config
      baseStyleRef.current = clone(map.getStyle())

      // add species range underneath everything else
      if (species) {
        map.addSource('species', speciesSource)
        speciesLayers.forEach((speciesLayer) => {
          map.addLayer({ ...speciesLayer, filter: ['==', 'species', species] })
        })
      }

      // add sources
      Object.entries(sources).forEach(([id, source]) => {
        map.addSource(id, source)
      })

      // add layers
      layers.forEach((layer) => {
        map.addLayer(layer)
      })

      // Set initial rendering of cluster / point layers
      styleDetectors()
    })

    // listen on source data events for detectors and update style at that time
    map.on('sourcedata', ({ sourceId, isSourceLoaded }) => {
      if (isSourceLoaded && sourceId === 'detectors') {
        styleDetectors(true)
      }
    })

    map.on('moveend', () => {
      const [lowerLeft, upperRight] = map.getBounds().toArray()
      onBoundsChange(lowerLeft.concat(upperRight))
    })

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-points'],
      })
      if (features && features.length) {
        console.log(
          'clicked features',
          features.map(({ id, properties }) => [id, properties])
        )

        const ids = new Set(features.map(({ id }) => id))
        onSelectFeatures(ids)
      }
    })

    map.on('mousemove', 'detectors-points', (e) => {
      const { current: metric } = valueFieldRef
      map.getCanvas().style.cursor = 'pointer'

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-points'],
      })

      if (!(features && features.length)) return

      tooltip.setLngLat(features[0].geometry.coordinates)

      const ids = new Set(features.map(({ id }) => id))

      // unhighlight all previous that are not currently visible
      const unhighlightIds = difference(highlightFeatureRef.current, ids)
      if (unhighlightIds.size) {
        unhighlightIds.forEach((id) =>
          map.setFeatureState({ source: 'detectors', id }, { highlight: false })
        )
      }

      ids.forEach((id) => {
        map.setFeatureState({ source: 'detectors', id }, { highlight: true })
      })
      highlightFeatureRef.current = ids

      const hasFilterLabel = hasFilterRef.current
        ? ' <i>within current filters</i>'
        : ''
      const tooltipSuffix = `${hasFilterLabel}.<br />Click to show details in the sidebar.`

      if (metric === 'id') {
        tooltip
          .setHTML(
            `${formatNumber(features.length)} ${quantityLabel(
              'detectors',
              features.length
            )} at this location${tooltipSuffix}`
          )
          .addTo(map)

        return
      }

      if (metric === 'species') {
        tooltip
          .setHTML(
            `${Math.max(
              ...features.map(({ properties: { total } }) => total)
            )} species detected at this location${tooltipSuffix}`
          )
          .addTo(map)

        return
      }

      const values = features.map(({ properties: { total } }) => total)
      const min = Math.min(...values)
      const max = Math.max(...values)
      let html = ''

      if (max === 0) {
        html = `Not detected${tooltipSuffix}`
      } else if (max !== min) {
        html = `${
          features.length
        } detectors at this location<br/>${formatNumber(min)} - ${formatNumber(
          max
        )} ${METRIC_LABELS[metric]}${tooltipSuffix}`
      } else {
        html = `${formatNumber(values[0])} ${
          METRIC_LABELS[metric]
        }${tooltipSuffix}`
      }

      tooltip.setHTML(html).addTo(map)
    })
    map.on('mouseleave', 'detectors-points', () => {
      map.getCanvas().style.cursor = ''

      const ids = highlightFeatureRef.current
      if (ids.size) {
        ids.forEach((id) =>
          map.setFeatureState({ source: 'detectors', id }, { highlight: false })
        )
      }
      highlightFeatureRef.current = new Set()

      tooltip.remove()
    })

    // clicking on clusters zooms in
    map.on('click', 'detectors-clusters', (e) => {
      const [
        {
          properties: { cluster_id: clusterId },
        },
      ] = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-clusters'],
      })

      map
        .getSource('detectors')
        .getClusterLeaves(clusterId, Infinity, 0, (err, children) => {
          if (err) return

          const geometries = children.map(({ geometry }) => geometry)
          const newBounds = calculateBounds(geometries)
          map.fitBounds(newBounds, {
            padding: 100,
            maxZoom: 18.5,
          })
        })
    })

    // hover highlights cluster and shows tooltip
    map.on('mousemove', 'detectors-clusters', (e) => {
      const { current: metric } = valueFieldRef
      map.getCanvas().style.cursor = 'pointer'

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-clusters'],
      })

      if (!(features && features.length)) return

      // unhighlight all previous
      const prevIds = highlightFeatureRef.current
      if (prevIds.size) {
        prevIds.forEach((id) =>
          map.setFeatureState(
            { source: 'detectors', id },
            { highlight: false, 'highlight-cluster': false }
          )
        )
      }

      // only highlight the first cluster or it gets confusing to interpret
      const {
        id,
        properties: { point_count, total, max },
      } = features[0]
      highlightFeatureRef.current = new Set([id])
      map.setFeatureState(
        { source: 'detectors', id },
        { 'highlight-cluster': true }
      )

      const hasFilterLabel = hasFilterRef.current
        ? ' <i>within current filters</i>'
        : ''
      const tooltipSuffix = `${hasFilterLabel}.<br />Click to zoom in.`

      let html = ''
      if (metric === 'id') {
        html = `${point_count} detectors at this location${tooltipSuffix}`
      } else if (metric === 'species') {
        html = `at least ${max} species detected at this location${tooltipSuffix}`
      } else {
        html = `${formatNumber(total)} ${
          METRIC_LABELS[metric]
        } (${point_count} detectors)${tooltipSuffix}`
      }
      tooltip
        .setLngLat(features[0].geometry.coordinates)
        .setHTML(html)
        .addTo(map)
    })

    map.on('mouseleave', 'detectors-clusters', () => {
      map.getCanvas().style.cursor = ''

      const ids = highlightFeatureRef.current
      if (ids.size) {
        ids.forEach((id) =>
          map.setFeatureState(
            { source: 'detectors', id },
            { highlight: false, 'highlight-cluster': false }
          )
        )
      }
      highlightFeatureRef.current = new Set()

      tooltip.remove()
    })

    return () => {
      map.remove()
    }
  }, [])

  // Only update style for detectors when they change because of the valueField
  useIsEqualEffect(() => {
    // update refs
    valueFieldRef.current = valueField
    hasFilterRef.current = hasFilters

    const { current: map } = mapRef

    if (!map) return

    const source = map.getSource('detectors')
    if (!source) return

    detectorsRef.current = detectors

    // reset to defaults until the styles are updated
    map.setPaintProperty('detectors-points', 'circle-radius', MINRADIUS)
    map.setPaintProperty('detectors-clusters', 'circle-radius', MINRADIUS)

    source.setData(toGeoJSONPoints(detectors))

    if (detectors.length === 0) {
      // update legend to remove detectors altogether
      updateLegend([])
    }

    // Sometimes updating the detectors doesn't trigger updating the style via sourcedata event
    map.once('idle', () => {
      styleDetectors(true)
    })

    // detectors are styled after data have loaded
  }, [detectors, maxValue, valueField, hasFilters])

  useEffect(() => {
    const { current: map } = mapRef
    if (!(map && map.isStyleLoaded())) return

    // unhighlight previous selected
    const prevSelected = selectedFeatureRef.current
    if (prevSelected !== null) {
      map.setFeatureState(
        { source: 'detectors', id: prevSelected },
        { selected: false }
      )
    }

    // highlight incoming
    if (selectedFeature !== null) {
      map.setFeatureState(
        { source: 'detectors', id: selectedFeature },
        { selected: true }
      )
    }
    selectedFeatureRef.current = selectedFeature
  }, [selectedFeature])

  const styleDetectorsImpl = (calculateMax = false) => {
    // console.log('style detectors', calculateMax, detectorsRef.current.length)
    const { current: map } = mapRef
    const { current: metric } = valueFieldRef

    // if there are no detectors to style, don't update style
    if (detectorsRef.current.length === 0) {
      return
    }

    let upperValue = 10

    // dynamically calculate the max values for the clusters visible in the map
    // NOTE: this doesn't work before the data are loaded
    if (calculateMax) {
      const visibleDetectors = map.querySourceFeatures('detectors')

      if (metric === 'id') {
        // only tally the detectors that have detections
        const hadDetections = visibleDetectors.filter(
          ({ properties: { total } }) => total > 0
        )
        // single points do not have point_count
        upperValue = niceNumber(
          Math.max(1, maxProperty(hadDetections, 'point_count')),
          0
        )
      } else if (metric === 'species') {
        upperValue = maxProperty(visibleDetectors, 'max', 0)
      } else {
        upperValue = niceNumber(maxProperty(visibleDetectors, 'total', 0))
      }
    } else {
      // Fall back to max number passed to map, since we can't calculate from clusters
      upperValue = niceNumber(maxValue)
    }

    if (Math.abs(upperValue) === Infinity) {
      // we aren't able to get a valid nice number if clusters aren't fully loaded yet
      console.warn(
        'Could not calculate a valid upper value from visible clusters'
      )
      upperValue = niceNumber(maxValue)
    }

    if (upperValue === 0) {
      // no detections
      map.setPaintProperty('detectors-points', 'circle-radius', MINRADIUS)
      map.setPaintProperty(
        'detectors-points',
        'circle-color',
        NONDETECTIONCOLOR
      )

      map.setPaintProperty('detectors-clusters', 'circle-radius', MINRADIUS)
      map.setPaintProperty(
        'detectors-clusters',
        'circle-color',
        NONDETECTIONCOLOR
      )

      if (detectors.length) {
        updateLegend(legends.detectors(upperValue, METRIC_LABELS[valueField]))
      } else {
        updateLegend([])
      }
      return
    }

    const property = metric === 'species' ? 'max' : 'total'

    const radiusExpr = interpolateExpr({
      property,
      domain: [1, upperValue],
      range: [MINRADIUS, MAXRADIUS],
      fallback: MINRADIUS,
      hasZero: true,
    })

    const colorExpr = interpolateExpr({
      property,
      domain: [1, upperValue],
      range: [DARKESTCOLOR, LIGHTESTCOLOR],
      fallback: NONDETECTIONCOLOR,
      hasZero: true,
    })

    map.setPaintProperty('detectors-points', 'circle-radius', radiusExpr)
    map.setPaintProperty('detectors-points', 'circle-color', colorExpr)

    map.setPaintProperty('detectors-clusters', 'circle-radius', radiusExpr)
    map.setPaintProperty('detectors-clusters', 'circle-color', colorExpr)

    updateLegend(legends.detectors(upperValue, METRIC_LABELS[valueField]))
  }

  const updateLegend = (detectorLegend = []) => {
    const entries = detectorLegend.slice()
    if (species) {
      entries.push(...legends.species())
    }

    setLegendEntries(entries)
  }

  const handleBasemapChange = (styleID) => {
    const { current: map } = mapRef
    const { current: baseStyle } = baseStyleRef

    const snapshot = clone(map.getStyle())
    const baseSources = new Set(Object.keys(baseStyle.sources))
    const baseLayers = new Set(baseStyle.layers.map(({ id }) => id))

    // diff the sources and layers to find those added by the user
    const userSources = Object.entries(snapshot.sources).filter(
      ([id]) => !baseSources.has(id)
    )
    const userLayers = snapshot.layers.filter(({ id }) => !baseLayers.has(id))

    map.setStyle(`mapbox://styles/mapbox/${styleID}`)

    map.once('style.load', () => {
      // after new style has loaded
      // save it so that we can diff with it on next change
      // and re-add the sources / layers back on it

      // save base for new style
      baseStyleRef.current = clone(map.getStyle())

      userSources.forEach(([id, source]) => {
        map.addSource(id, source)
      })

      userLayers.forEach((layer) => {
        map.addLayer(layer)
      })
    })
  }

  const legendTitle =
    valueField === 'id'
      ? `Number of ${METRIC_LABELS[valueField]} that detected ${SPECIES[species].commonName}`
      : `Number of ${METRIC_LABELS[valueField]}`

  return (
    <Box sx={{ position: 'relative', flex: '1 0 auto', height: '100%' }}>
      <div ref={mapNode} style={{ width: '100%', height: '100%' }} />

      <Legend
        entries={legendEntries}
        title={legendTitle}
        note={
          detectors.length
            ? 'Map shows detector locations.  They may be clustered together if near each other.'
            : 'No detector locations visible.'
        }
      />

      {mapRef.current && (
        <StyleSelector
          styles={styles}
          token={accessToken}
          onChange={handleBasemapChange}
        />
      )}
    </Box>
  )
}

Map.propTypes = {
  bounds: PropTypes.arrayOf(PropTypes.number),
  // List of detector locations, provided at map init
  detectors: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
    })
  ).isRequired,
  valueField: PropTypes.string.isRequired,
  maxValue: PropTypes.number.isRequired,
  species: PropTypes.string,
  selectedFeature: PropTypes.number,
  hasFilters: PropTypes.bool,
  onSelectFeatures: PropTypes.func,
  onBoundsChange: PropTypes.func,
}

Map.defaultProps = {
  bounds: [],
  species: null,
  selectedFeature: null,
  hasFilters: false,
  onSelectFeatures: () => {},
  onBoundsChange: () => {},
}

export default Map
