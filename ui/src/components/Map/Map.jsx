import React, { useRef, useState, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

import { config, sources } from './config'
import { mapboxgl } from './mapbox'
import { PMTilesSource } from './pmtiles'
import StyleSelector from './StyleSelector'

const { center, zoom, styles } = config

const Map = ({ onCreateMap, onBasemapChange, children }) => {
  const mapNode = useRef(null)
  const baseStyleRef = useRef(null)
  const [map, setMap] = useState(null)

  useLayoutEffect(
    () => {
      const mapObj = new mapboxgl.Map({
        container: mapNode.current,
        style: `mapbox://styles/mapbox/${styles[0]}`,
        center,
        zoom,
        minZoom: config.minZoom || 0,
      })
      // mapRef.current = mapObj
      window.map = mapObj

      mapObj.addControl(new mapboxgl.NavigationControl(), 'top-right')
      mapObj.dragRotate.disable()

      // enable PMTiles source
      mapboxgl.Style.setSourceType(PMTilesSource.SOURCE_TYPE, PMTilesSource)

      mapObj.on('load', () => {
        // snapshot existing map config
        const { sources: styleSources, layers: styleLayers } = mapObj.getStyle()
        baseStyleRef.current = {
          sources: styleSources,
          layers: styleLayers,
        }

        // add sources
        Object.entries(sources).forEach(([id, source]) => {
          mapObj.addSource(id, source)
        })

        setMap(mapObj)
        onCreateMap(mapObj)
      })

      return () => {
        mapObj.remove()
      }
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  )

  const handleBasemapChange = (styleID) => {
    if (!map) return

    const { current: baseStyle } = baseStyleRef

    const { sources: curSources, layers: curLayers } = map.getStyle()
    const baseSources = new Set(Object.keys(baseStyle.sources))
    const baseLayers = new Set(baseStyle.layers.map(({ id }) => id))

    // diff the sources and layers to find those added by the user
    const userSources = Object.entries(curSources).filter(
      ([id]) => !baseSources.has(id)
    )
    const userLayers = curLayers.filter(({ id }) => !baseLayers.has(id))

    map.setStyle(`mapbox://styles/mapbox/${styleID}`)

    map.once('style.load', () => {
      // after new style has loaded
      // save it so that we can diff with it on next change
      // and re-add the sources / layers back on it

      // save base for new style
      const { sources: styleSources, layers: styleLayers } = map.getStyle()
      baseStyleRef.current = {
        sources: styleSources,
        layers: styleLayers,
      }

      userSources.forEach(([id, source]) => {
        map.addSource(id, source)
      })

      userLayers.forEach((layer) => {
        map.addLayer(layer)
      })

      // call callback so that feature state can be set again
      onBasemapChange()
    })
  }

  return (
    <Box
      sx={{
        position: 'relative',
        flex: '1 0 auto',
        height: '100%',
        '& .mapboxgl-popup-content': {
          lineHeight: 1.2,
          fontSize: 1,
        },
      }}
    >
      <div ref={mapNode} style={{ width: '100%', height: '100%' }} />

      {map && (
        <>
          <StyleSelector styles={styles} onChange={handleBasemapChange} />
          {children}
        </>
      )}
    </Box>
  )
}

Map.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.element]),
  onCreateMap: PropTypes.func.isRequired,
  onBasemapChange: PropTypes.func.isRequired,
}

Map.defaultProps = {
  children: null,
}

export default Map
