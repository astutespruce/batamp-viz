/* eslint-disable max-len, no-underscore-dangle camelcase */
import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { List, Set, fromJS } from 'immutable'
import { useDebouncedCallback } from 'use-debounce'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import styled, { theme } from 'style'
import { hasWindow } from 'util/dom'
import { formatNumber, quantityLabel } from 'util/format'
import { niceNumber } from 'util/data'

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

const Wrapper = styled.div`
  position: relative;
  flex: 1 0 auto;
  height: 100%;
`

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
  // if there is no window, we cannot render this component
  if (!hasWindow) {
    return null
  }

  const { accessToken, styles } = config

  // Use refs to coordinate values set after map is constructed
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const baseStyleRef = useRef(null)
  const selectedFeatureRef = useRef(selectedFeature)
  const highlightFeatureRef = useRef(Set())
  const valueFieldRef = useRef(valueField)
  const hasFilterRef = useRef(hasFilters)

  const [legendEntries, setLegendEntries] = useState(
    species ? legends.species() : []
  )

  // Debounce calls to set style & legend, since these may be called frequently during panning or changing data
  const [styleDetectors] = useDebouncedCallback(
    calculateMax => styleDetectorsImpl(calculateMax),
    100
  )

  useEffect(() => {
    // set initial references to variables that update
    valueFieldRef.current = valueField

    const { padding, bounds: initBounds } = config
    let { center, zoom } = config

    const targetBounds = bounds.isEmpty() ? initBounds : bounds.toJS()

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
    sources.detectors.data = toGeoJSONPoints(detectors.toJS())

    map.on('load', () => {
      // snapshot existing map config
      baseStyleRef.current = fromJS(map.getStyle())

      // add species range underneath everything else
      if (species) {
        map.addSource('species', speciesSource)
        speciesLayers.forEach(speciesLayer => {
          map.addLayer(
            fromJS(speciesLayer)
              .merge({ filter: ['==', 'species', species] })
              .toJS()
          )
        })
      }

      // add sources
      Object.entries(sources).forEach(([id, source]) => {
        map.addSource(id, source)
      })

      // add layers
      layers.forEach(layer => {
        map.addLayer(layer)
      })

      // Set initial rendering of cluster / point layers
      styleDetectors()
    })

    // listen on source data events for detectors and update style at that time
    map.on('sourcedata', ({ sourceId, isSourceLoaded }) => {
      if (isSourceLoaded && sourceId === 'detectors') {
        console.log('source data on detectors')
        styleDetectors(true)
      }
    })

    map.on('moveend', () => {
      const [lowerLeft, upperRight] = map.getBounds().toArray()
      onBoundsChange(lowerLeft.concat(upperRight))
    })

    map.on('click', 'admin1-fill', e => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['admin1-fill'],
      })
      if (features) {
        console.log(
          'clicked admin features',
          features,
          features.map(({ properties }) => properties)
        )
        // TODO: process selected features and highlight
        // onSelectFeature(feature.properties)
      }
    })

    map.on('click', e => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-points'],
      })
      if (features && features.length) {
        console.log(
          'clicked features',
          features.map(({ id, properties }) => [id, properties])
        )

        const ids = Set(features.map(({ id }) => id))
        onSelectFeatures(ids)
      }
    })

    map.on('mousemove', 'detectors-points', e => {
      const { current: metric } = valueFieldRef
      map.getCanvas().style.cursor = 'pointer'

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-points'],
      })

      if (!(features && features.length)) return

      tooltip.setLngLat(features[0].geometry.coordinates)

      const ids = Set(features.map(({ id }) => id))

      // unhighlight all previous
      const unhighlightIds = highlightFeatureRef.current.subtract(ids)
      if (unhighlightIds.size) {
        unhighlightIds.forEach(id =>
          map.setFeatureState({ source: 'detectors', id }, { highlight: false })
        )
      }

      ids.forEach(id => {
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
        ids.forEach(id =>
          map.setFeatureState({ source: 'detectors', id }, { highlight: false })
        )
      }
      highlightFeatureRef.current = Set()

      tooltip.remove()
    })

    // clicking on clusters zooms in
    map.on('click', 'detectors-clusters', e => {
      const [
        {
          // geometry: { coordinates },
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
    map.on('mousemove', 'detectors-clusters', e => {
      const { current: metric } = valueFieldRef
      map.getCanvas().style.cursor = 'pointer'

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-clusters'],
      })

      if (!(features && features.length)) return

      // unhighlight all previous
      const prevIds = highlightFeatureRef.current
      if (prevIds.size) {
        prevIds.forEach(id =>
          map.setFeatureState(
            { source: 'detectors', id },
            { highlight: false, 'highlight-cluster': false }
          )
        )
      }

      // only highlight the first cluster or it gets confusing to interpret
      const {
        id,
        properties: { point_count, total },
      } = features[0]
      highlightFeatureRef.current = Set([id])
      map.setFeatureState(
        { source: 'detectors', id },
        { 'highlight-cluster': true }
      )

      const hasFilterLabel = hasFilterRef.current
        ? ' <i>within current filters</i>'
        : ''
      const tooltipSuffix = `${hasFilterLabel}.<br />Click to zoom in.`

      // within filtered data<br />
      let html = ''
      if (metric === 'id') {
        html = `${point_count} detectors at this location${tooltipSuffix}`
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
        ids.forEach(id =>
          map.setFeatureState(
            { source: 'detectors', id },
            { highlight: false, 'highlight-cluster': false }
          )
        )
      }
      highlightFeatureRef.current = Set()

      tooltip.remove()
    })

    return () => {
      map.remove()
    }
  }, [])

  // Only update style for detectors when they change because of the valueField
  useEffect(() => {
    // update refs
    valueFieldRef.current = valueField
    hasFilterRef.current = hasFilters

    const { current: map } = mapRef

    if (!map) return

    const source = map.getSource('detectors')
    if (!source) return

    source.setData(toGeoJSONPoints(detectors.toJS()))

    if (detectors.size === 0) {
      // update legend to remove detectors altogether
      updateLegend([])
    }

    console.log('firing update to detectors', maxValue)

    // Sometimes updating the detectors doesn't trigger updating the style via sourcedata event
    map.once('idle', () => styleDetectors(true))

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
    console.log('style detectors', calculateMax)
    const { current: map } = mapRef
    const { current: metric } = valueFieldRef

    // if there are no detectors to style, don't update style
    if (detectors.size === 0) {
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
        upperValue = niceNumber(maxProperty(hadDetections, 'point_count', 0))
      } else {
        upperValue = niceNumber(maxProperty(visibleDetectors, 'total', 0))
      }
    } else {
      console.log('falling back to max value', maxValue, niceNumber(maxValue))
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
      if (detectors.size) {
        updateLegend(legends.detectors(upperValue))
      } else {
        updateLegend([])
      }
      return
    }

    console.log('upper ', upperValue)

    const colorExpr = interpolateExpr({
      property: 'total',
      domain: [1, upperValue],
      range: [DARKESTCOLOR, LIGHTESTCOLOR],
      fallback: NONDETECTIONCOLOR,
      hasZero: true,
    })

    map.setPaintProperty('detectors-clusters', 'circle-color', colorExpr)
    map.setPaintProperty('detectors-points', 'circle-color', colorExpr)

    const radiusExpr = interpolateExpr({
      property: 'total',
      domain: [1, upperValue],
      range: [MINRADIUS, MAXRADIUS],
      fallback: MINRADIUS,
      hasZero: true,
    })

    map.setPaintProperty('detectors-clusters', 'circle-radius', radiusExpr)
    map.setPaintProperty('detectors-points', 'circle-radius', radiusExpr)

    // updateLegend(getDetectorLegend(upperValue))
    updateLegend(legends.detectors(upperValue))
  }

  const updateLegend = (detectorLegend = []) => {
    const entries = detectorLegend.slice()
    if (species) {
      entries.push(...legends.species())
    }

    setLegendEntries(entries)
  }

  // TODO: move to util
  const handleBasemapChange = styleID => {
    const { current: map } = mapRef
    const { current: baseStyle } = baseStyleRef

    const snapshot = fromJS(map.getStyle())
    const baseSources = baseStyle.get('sources')
    const baseLayers = baseStyle.get('layers')

    // diff the sources and layers to find those added by the user
    const userSources = snapshot
      .get('sources')
      .filter((_, key) => !baseSources.has(key))
    const userLayers = snapshot
      .get('layers')
      .filter(layer => !baseLayers.includes(layer))

    map.setStyle(`mapbox://styles/mapbox/${styleID}`)

    map.once('style.load', () => {
      // after new style has loaded
      // save it so that we can diff with it on next change
      // and re-add the sources / layers back on it

      // save base for new style
      baseStyleRef.current = fromJS(map.getStyle())

      userSources.forEach((source, id) => {
        map.addSource(id, source.toJS())
      })

      userLayers.forEach(layer => {
        map.addLayer(layer.toJS())
      })
    })
  }

  const legendTitle =
    valueField === 'id'
      ? `Number of ${METRIC_LABELS[valueField]} that detected ${
          SPECIES[species].commonName
        }`
      : `Number of ${METRIC_LABELS[valueField]}`

  return (
    <Wrapper>
      <div ref={mapNode} style={{ width: '100%', height: '100%' }} />

      <Legend
        entries={legendEntries}
        title={legendTitle}
        note={
          detectors.size
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
    </Wrapper>
  )
}

Map.propTypes = {
  bounds: ImmutablePropTypes.listOf(PropTypes.number),
  // List of detector locations, provided at map init
  detectors: ImmutablePropTypes.listOf(
    ImmutablePropTypes.mapContains({
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
  bounds: List(),
  species: null,
  selectedFeature: null,
  hasFilters: false,
  onSelectFeatures: () => {},
  onBoundsChange: () => {},
}

export default Map
// Working notes

// highlight points on hover
// store hover state in local ref?
// map.setFeatureState({source: 'detectors', id: 303}, {highlight: true})
// map.setPaintProperty('detectors-points', 'circle-color', ['case', ["boolean", ["feature-state", "highlight"], false], '#F00', ...<other rules>])

// rendering admin units, use setFeatureState (example: https://jsfiddle.net/mapbox/gortd715/)
// on load of tiles:
// ids.forEach(id => map.setFeatureState({id, source: 'admin', sourceLayer:'admin1'}, {total: 0}))
// totals = sumBy(d, 'id', 'detections')
// totals.entrySeq().forEach(([id, total]) => map.setFeatureState({id, source: 'admin', sourceLayer:'admin1'}, {total}))

// get max for rendering clusters and points, on update of detectors
// max = Math.max(...map.queryRenderedFeatures({layers: ['detectors-clusters', 'detectors-points']}).map(({properties: {total}}) => total))
// or
// max = Math.max(...map.querySourceFeatures("detectors").map(({properties: {total}}) => total))
// map.setPaintProperty('detectors-clusters', 'circle-radius', ['interpolate', ['linear'], ['get', 'total'], 1,minRadius, max, maxRadius])
// map.setPaintProperty('detectors-points', 'circle-radius', ['interpolate', ['linear'], ['get', 'total'], 1,minRadius, max, maxRadius])
