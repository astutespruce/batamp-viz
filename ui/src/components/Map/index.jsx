/* eslint-disable max-len, no-underscore-dangle camelcase */
import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { List, Set, fromJS } from 'immutable'
import { interpolate, interpolateRgb } from 'd3-interpolate'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import styled, { theme } from 'style'
import { hasWindow } from 'util/dom'
import { formatNumber, quantityLabel } from 'util/format'
import { niceNumber, flatzip } from 'util/data'

import StyleSelector from './StyleSelector'
import Legend from './Legend'
import { getCenterAndZoom, toGeoJSONPoints, calculateBounds } from './util'
import {
  config,
  sources,
  layers,
  speciesSource,
  speciesLayers,
  MINRADIUS,
  MAXRADIUS,
  LIGHTESTCOLOR,
  DARKESTCOLOR,
} from './config'

const TRANSPARENT = 'rgba(0,0,0,0)'

const Wrapper = styled.div`
  position: relative;
  flex: 1 0 auto;
`

const Map = ({
  detectors,
  // totals,
  data,
  valueField,
  maxValue,
  selectedFeature,
  bounds,
  species,
  onSelectFeatures,
  onBoundsChange,
}) => {
  // if there is no window, we cannot render this component
  if (!hasWindow) {
    return null
  }

  const { accessToken, styles } = config

  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const baseStyleRef = useRef(null)
  const selectedFeatureRef = useRef(selectedFeature)
  const highlightFeatureRef = useRef(Set())
  const valueFieldRef = useRef(valueField)

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
      map.getCanvas().style.cursor = 'pointer'

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-points'],
      })

      if (!(features && features.length)) return

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

      if (valueFieldRef.current === 'id') {
        tooltip
          .setLngLat(features[0].geometry.coordinates)
          .setHTML(
            `${formatNumber(features.length)} ${quantityLabel(
              'detectors',
              features.length
            )} at this location<br />Click to show details in the sidebar.`
          )
          .addTo(map)

        return
      }

      const values = features.map(({ properties: { total } }) => total)
      if (features.length > 1) {
        const min = Math.min(...values)
        const max = Math.max(...values)

        tooltip
          .setLngLat(features[0].geometry.coordinates)
          .setHTML(
            `${features.length} detectors at this location<br/>${formatNumber(
              min
            )} - ${formatNumber(
              max
            )} ${valueField}<br />Click to show details in the sidebar.`
          )
          .addTo(map)
      } else {
        tooltip
          .setLngLat(features[0].geometry.coordinates)
          .setHTML(
            `${formatNumber(values[0])} ${quantityLabel(
              valueField,
              values[0]
            )}<br />Click to show details in the sidebar.`
          )
          .addTo(map)
      }
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
            maxZoom: 24,
          })
        })
    })

    // hover highlights cluster and shows tooltip
    map.on('mousemove', 'detectors-clusters', e => {
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

      let html = ''
      if (valueFieldRef.current === 'id') {
        html = `${point_count} detectors at this location<br />Click to zoom in.`
      } else {
        html = `${formatNumber(
          total
        )} ${valueField} (${point_count} detectors)<br />Click to zoom in.`
      }
      tooltip
        .setLngLat(features[0].geometry.coordinates)
        .setHTML(html)
        .addTo(map)
    })
    map.on('mouseleave', 'detectors-clusters', () => {
      map.getCanvas().style.cursor = ''

      // TODO: unhighlight
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

    const { current: map } = mapRef
    if (!(map && map.isStyleLoaded())) return

    // console.log('updated detectors for map', detectors.toJS())
    const source = map.getSource('detectors')
    if (!source) return

    source.setData(toGeoJSONPoints(detectors.toJS()))
    styleDetectors()
  }, [detectors, maxValue, valueField])

  useEffect(() => {
    const { current: map } = mapRef
    if (!(map && map.isStyleLoaded())) return

    // unhighlight previous selected
    const prevSelected = selectedFeatureRef.current
    // prevSelected.forEach(id => {
    //   map.setFeatureState({ source: 'detectors', id }, { selected: false })
    // })
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
    // selectedFeatures.forEach(id =>
    //   map.setFeatureState({ source: 'detectors', id }, { selected: true })
    // )
    selectedFeatureRef.current = selectedFeature
  }, [selectedFeature])

  // Update when data change
  // useEffect(() => {
  //   const { current: map } = mapRef
  //   if (!(map && map.isStyleLoaded())) return
  // }, [data])

  const styleDetectors = () => {
    const { current: map } = mapRef

    // cannot interpolate if total <= 1
    if (maxValue <= 1) {
      map.setPaintProperty('detectors-clusters', 'circle-radius', MINRADIUS)
      map.setPaintProperty('detectors-clusters', 'circle-color', LIGHTESTCOLOR)
      map.setPaintProperty('detectors-points', 'circle-radius', MINRADIUS)
      map.setPaintProperty('detectors-points', 'circle-color', LIGHTESTCOLOR)

      return
    }

    if (valueField === 'id') {
      // how to find the max cluster size?
      // visible, but filtered: Math.max(...map.querySourceFeatures("detectors").map(({properties: {point_count}}) => point_count).filter(v => !isNaN(v)))

      // set upper bound to 1/5th of the number of detectors
      const upperValue = niceNumber(maxValue / 5)
      const colors = flatzip([1, upperValue], [LIGHTESTCOLOR, DARKESTCOLOR])
      map.setPaintProperty('detectors-clusters', 'circle-radius', [
        'interpolate',
        ['linear'],
        ['get', 'point_count'],
        // make clusters slightly larger than single points
        ...flatzip([1, upperValue], [MINRADIUS + 2, MAXRADIUS]),
      ])
      map.setPaintProperty('detectors-clusters', 'circle-color', [
        'interpolate',
        ['linear'],
        ['get', 'point_count'],
        ...colors,
      ])
      map.setPaintProperty('detectors-points', 'circle-radius', MINRADIUS)
      map.setPaintProperty('detectors-points', 'circle-color', LIGHTESTCOLOR)
    } else {
      const upperValue = niceNumber(maxValue)
      const colors = flatzip([1, upperValue], [LIGHTESTCOLOR, DARKESTCOLOR])
      map.setPaintProperty('detectors-clusters', 'circle-radius', [
        'interpolate',
        ['linear'],
        ['get', 'total'],
        ...flatzip([1, upperValue], [MINRADIUS, MAXRADIUS]),
      ])
      map.setPaintProperty('detectors-clusters', 'circle-color', [
        'interpolate',
        ['linear'],
        ['get', 'total'],
        ...colors,
      ])
      map.setPaintProperty('detectors-points', 'circle-radius', [
        'interpolate',
        ['linear'],
        ['get', 'total'],
        ...flatzip([1, upperValue], [MINRADIUS, MAXRADIUS]),
      ])
      map.setPaintProperty('detectors-points', 'circle-color', [
        'interpolate',
        ['linear'],
        ['get', 'total'],
        ...colors,
      ])
    }
  }

  // TODO: move to util
  const getLegend = () => {
    const radiusInterpolator = interpolate(MINRADIUS, MAXRADIUS)
    const colorInterpolator = interpolateRgb(LIGHTESTCOLOR, DARKESTCOLOR)

    const entries = []

    if (maxValue > 0) {
      const upperValue =
        valueField === 'id' ? niceNumber(maxValue / 5) : niceNumber(maxValue)
      let breaks = []
      if (upperValue - 1 > 4) {
        breaks = [0.66, 0.33]
      }

      entries.push(
        {
          type: 'circle',
          radius: MAXRADIUS,
          label: `≥ ${formatNumber(upperValue, 0)}`,
          color: DARKESTCOLOR,
        },
        ...breaks.map(b => ({
          type: 'circle',
          label: `${formatNumber(upperValue * b, 0)}`,
          radius: radiusInterpolator(b),
          color: colorInterpolator(b),
        })),
        { type: 'circle', radius: MINRADIUS, label: '1', color: LIGHTESTCOLOR }
      )
    }

    if (species) {
      entries.push({
        color: `${theme.colors.highlight[500]}33`,
        borderColor: `${theme.colors.highlight[500]}33`,
        borderWidth: 1,
        label: 'Species range',
      })
    }

    return entries
  }

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

  return (
    <Wrapper>
      <div ref={mapNode} style={{ width: '100%', height: '100%' }} />

      <Legend
        entries={getLegend()}
        title={`Number of ${valueField === 'id' ? 'detectors' : valueField}`}
        note={
          maxValue
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
  // data: ImmutablePropTypes.listOf(
  //   ImmutablePropTypes.mapContains({
  //     detector: PropTypes.number.isRequired,
  //     lat: PropTypes.number.isRequired,
  //     lon: PropTypes.number.isRequired,
  //   })
  // ).isRequired,
  bounds: ImmutablePropTypes.listOf(PropTypes.number),
  // detectors:
  //   ImmutablePropTypes.mapContains({
  //     lat: PropTypes.number.isRequired,
  //     lon: PropTypes.number.isRequired,
  //   }).isRequired,
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
  // selectedFeatures: ImmutablePropTypes.setOf(PropTypes.number),
  selectedFeature: PropTypes.number,
  onSelectFeatures: PropTypes.func,
  onBoundsChange: PropTypes.func,
}

Map.defaultProps = {
  bounds: List(),
  species: null,
  // selectedFeatures: Set(),
  selectedFeature: null,
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

// in map load:
// add layers
// layers.forEach(layer => {
//   // add highlight layer for each
//   const highlightLayer = fromJS(layer)
//     .merge({
//       id: `${layer.id}-highlight`,
//       type: 'fill',
//       layout: {},
//       paint: {
//         'fill-color': TRANSPARENT,
//         'fill-opacity': 0.5,
//       },
//     })
//     .toJS()
//   map.addLayer(highlightLayer)

//   // add layer last so that outlines are on top of highlight
//   /* eslint-disable no-param-reassign */
//   layer.layout.visibility = grid === layer.id ? 'visible' : 'none'
//   map.addLayer(layer)
// })

// map.on('click', e => {
//   const { current: curGrid } = gridRef

//   if (!curGrid) return
//   const [feature] = map.queryRenderedFeatures(e.point, {
//     layers: [`${curGrid}-highlight`],
//   })
//   if (feature) {
//     const { id } = feature.properties
//     updateHighlight(curGrid, id)

//     onSelectFeature(feature.properties)
//   }
// })

// map.on('zoomend', () => {
//   console.log('zoom', map.getZoom())

//   if (gridRef.current === 'na_grts' && map.getZoom() < 5) {
//     noteNode.current.innerHTML = 'Zoom in further to see GRTS grid...'
//   } else {
//     noteNode.current.innerHTML = ''
//   }
// })

// useEffect(() => {
//   const { current: map } = mapRef
//   const { current: marker } = markerRef

//   if (!map.loaded()) return

//   if (location !== null) {
//     onSelectFeature(null)
//     const { latitude, longitude } = location
//     map.flyTo({ center: [longitude, latitude], zoom: 10 })

//     map.once('moveend', () => {
//       const point = map.project([longitude, latitude])
//       const feature = getFeatureAtPoint(point)
//       // source may still be loading, try again in 1 second
//       if (!feature) {
//         setTimeout(() => {
//           getFeatureAtPoint(point)
//         }, 1000)
//       }
//     })

//     if (!marker) {
//       markerRef.current = new mapboxgl.Marker()
//         .setLngLat([longitude, latitude])
//         .addTo(map)
//     } else {
//       marker.setLngLat([longitude, latitude])
//     }
//   } else if (marker) {
//     marker.remove()
//     markerRef.current = null
//   }
// }, [location])

// useEffect(() => {
//   console.log('grid changed', grid)

//   const { current: map } = mapRef
//   if (!map.loaded()) return

//   // clear out any previous highlights
//   layers.forEach(({ id }) => {
//     updateHighlight(id, null)
//   })

//   layers.forEach(({ id }) => {
//     map.setLayoutProperty(id, 'visibility', grid === id ? 'visible' : 'none')
//   })
// }, [grid])

// const updateHighlight = (gridID, id) => {
//   const { current: map } = mapRef
//   const layer = `${gridID}-highlight`

//   if (id !== null) {
//     map.setPaintProperty(layer, 'fill-color', [
//       'match',
//       ['get', 'id'],
//       id,
//       '#b5676d',
//       TRANSPARENT,
//     ])
//   } else {
//     map.setPaintProperty(layer, 'fill-color', TRANSPARENT)
//   }
// }

// const getFeatureAtPoint = point => {
//   const { current: map } = mapRef
//   const { current: curGrid } = gridRef

//   if (!(map && curGrid)) return null

//   const [feature] = map.queryRenderedFeatures(point, {
//     layers: [`${curGrid}-highlight`],
//   })
//   if (feature) {
//     console.log('got feature at point', feature)
//     updateHighlight(curGrid, feature.properties.id)
//     onSelectFeature(feature.properties)
//   }
//   return feature
// }
