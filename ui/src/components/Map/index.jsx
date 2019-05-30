/* eslint-disable max-len, no-underscore-dangle */
import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { List, fromJS } from 'immutable'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import styled from 'style'
import { hasWindow } from 'util/dom'

import StyleSelector from './StyleSelector'
import { getCenterAndZoom, toGeoJSONPoints } from './util'
import { config, sources, layers, MINRADIUS, MAXRADIUS } from './config'

const TRANSPARENT = 'rgba(0,0,0,0)'

const Wrapper = styled.div`
  position: relative;
  flex: 1 0 auto;
`

const Map = ({
  detectors,
  // totals,
  data,
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

      // set initial rendering of detectors
      // totals.entrySeq().forEach(([id, total]) => {
      //   map.setFeatureState({ id, source: 'detectors' }, { total })
      // })
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

    return () => {
      map.remove()
    }
  }, [])

  // Update detectors
  useEffect(() => {
    const { current: map } = mapRef
    if (!(map && map.isStyleLoaded())) return

    console.log('incoming data to map', detectors.toJS())

    // console.log(geoJSON)
    map.getSource('detectors').setData(toGeoJSONPoints(detectors.toJS()))

    // update symbology - TODO: watch for race condition with clustering
    const max = Math.max(
      ...map
        .querySourceFeatures('detectors')
        .map(({ properties: { total } }) => total)
    )
    map.setPaintProperty('detectors-clusters', 'circle-radius', [
      'interpolate',
      ['linear'],
      ['get', 'total'],
      1,
      MINRADIUS,
      max,
      MAXRADIUS,
    ])
    map.setPaintProperty('detectors-points', 'circle-radius', [
      'interpolate',
      ['linear'],
      ['get', 'total'],
      1,
      MINRADIUS,
      max,
      MAXRADIUS,
    ])
  }, [detectors])

  // Update points when the filtered data change
  // useEffect(() => {
  //   const { current: map } = mapRef
  //   if (!(map && map.isStyleLoaded())) return

  //   console.log('incoming totals', totals.toJS())
  //   window.totals = totals

  //   // doesn't work w/ clustering
  //   // totals.entrySeq().forEach(([id, total]) => {
  //   //   map.setFeatureState({ id, source: 'detectors' }, { total })
  //   // })
  // }, [data])

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
