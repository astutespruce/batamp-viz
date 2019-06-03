/* eslint-disable max-len, no-underscore-dangle */
import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { List, fromJS } from 'immutable'
import { interpolate, interpolateRgb } from 'd3-interpolate'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import styled from 'style'
import { hasWindow } from 'util/dom'
import { formatNumber } from 'util/format'
import { niceNumber, flatzip } from 'util/data'

import StyleSelector from './StyleSelector'
import Legend from './Legend'
import { getCenterAndZoom, toGeoJSONPoints } from './util'
import {
  config,
  sources,
  layers,
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
  onSelectFeature,
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

  useEffect(() => {
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

    // Construct GeoJSON points from detector locations
    sources.detectors.data = toGeoJSONPoints(detectors.toJS())

    map.on('load', () => {
      // snapshot existing map config
      baseStyleRef.current = fromJS(map.getStyle())

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

    map.on('click', e => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['detectors-points', 'detectors-clusters'],
      })
      if (features) {
        console.log(
          'clicked features',
          features.map(({ properties }) => properties)
        )
        // TODO: process selected features and highlight
        // onSelectFeature(feature.properties)
      }
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

    //   map.on('mouseenter', 'clusters', e => {
    //     map.getCanvas().style.cursor = 'pointer'

    //     const [feature] = map.queryRenderedFeatures(e.point, {
    //       layers: ['clusters'],
    //     })
    //     const clusterId = feature.properties.cluster_id

    //     // highlight
    //     map.setFilter('points-highlight', [
    //       '==',
    //       ['get', 'cluster_id'],
    //       clusterId,
    //     ])

    //     map
    //       .getSource('points')
    //       .getClusterLeaves(clusterId, Infinity, 0, (err, children) => {
    //         if (err) return

    //         let names = children
    //           .slice(0, 5)
    //           .map(({ properties: { name } }) => name)
    //           .join('<br/>')
    //         if (children.length > 5) {
    //           names += `<br/>and ${children.length - 5} more...`
    //         }

    //         tooltip
    //           .setLngLat(feature.geometry.coordinates)
    //           .setHTML(names)
    //           .addTo(map)
    //       })
    //   })
    //   map.on('mouseleave', 'clusters', () => {
    //     map.getCanvas().style.cursor = ''
    //     map.setFilter('points-highlight', [
    //       '==',
    //       'id',
    //       selectedFeatureRef.current || Infinity,
    //     ])
    //     tooltip.remove()
    //   })

    return () => {
      map.remove()
    }
  }, [])

  // Only update style for detectors when they change because of the valueField
  useEffect(() => {
    const { current: map } = mapRef
    if (!(map && map.isStyleLoaded())) return

    // console.log('updated detectors for map', detectors.toJS())
    map.getSource('detectors').setData(toGeoJSONPoints(detectors.toJS()))
    styleDetectors()
  }, [detectors, maxValue])

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

  const getLegend = () => {
    if (maxValue === 0) {
      return []
    }

    const radiusInterpolator = interpolate(MINRADIUS, MAXRADIUS)
    const colorInterpolator = interpolateRgb(LIGHTESTCOLOR, DARKESTCOLOR)

    const upperValue =
      valueField === 'id' ? niceNumber(maxValue / 5) : niceNumber(maxValue)
    let breaks = []
    if (upperValue - 1 > 4) {
      breaks = [0.66, 0.33]
    }

    const entries = [
      {
        type: 'circle',
        radius: MAXRADIUS,
        label: `≥ ${formatNumber(upperValue, 0)}`,
        color: DARKESTCOLOR,
      },
    ]
      .concat(
        breaks.map(b => ({
          type: 'circle',
          label: `${formatNumber(upperValue * b, 0)}`,
          radius: radiusInterpolator(b),
          color: colorInterpolator(b),
        }))
      )
      .concat([
        { type: 'circle', radius: MINRADIUS, label: '1', color: LIGHTESTCOLOR },
      ])
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
  // Map of id:total for each unit, updated dynamically by crossfilter
  // totals: ImmutablePropTypes.map.isRequired,
  selectedFeature: PropTypes.number,
  onSelectFeature: PropTypes.func,
  onBoundsChange: PropTypes.func,
}

Map.defaultProps = {
  bounds: List(),
  selectedFeature: null,
  onSelectFeature: () => {},
  onBoundsChange: () => {},
}

export default Map
// Working notes

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
