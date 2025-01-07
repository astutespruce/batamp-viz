// @refresh reset
/* eslint-disable max-len,no-underscore-dangle,camelcase */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'
import { dequal } from 'dequal'

import { useCrossfilter } from 'components/Crossfilter'
import { METRIC_LABELS, SPECIES, H3_COLS } from 'config'
import { formatNumber, quantityLabel } from 'util/format'
import { niceNumber, difference, clone } from 'util/data'
import { useIsEqualEffect } from 'util/hooks'

import {
  layers,
  speciesLayers,
  getHexRenderer,
  Map,
  mapboxgl,
  setFeatureHighlight,
  Legend,
} from 'components/Map'

// TODO: props
const SpeciesMap = ({ speciesID, selectedFeature }) => {
  const mapRef = useRef(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const hoverFeatureRef = useRef(null)
  const selectedFeatureRef = useRef(selectedFeature)

  // FIXME:
  // const valueFieldRef = useRef(valueField)
  // const hasFilterRef = useRef(hasFilters)
  // const detectorsRef = useRef(detectors)

  // const [legendEntries, setLegendEntries] = useState(
  //   species ? legends.species() : []
  // )

  const {
    state: {
      metric: { label: metricLabel },
      hasFilters,
      filters,
      h3Totals,
      h3Stats,
      h3Ids,
      siteIds,
      siteTotals,
    },
  } = useCrossfilter()

  console.log('stats', h3Stats)

  const curStateRef = useRef({
    h3Totals,
    h3Renderer: Object.fromEntries(
      H3_COLS.map((col) => [
        col,
        getHexRenderer(Math.max(0, Math.max(...Object.values(h3Totals[col])))),
      ])
    ),
    siteTotals,
    siteMax: Math.max(0, Math.max(...Object.values(siteTotals))),
  })

  // initialize renderer to lowest hex level
  const [legendEntries, setLegendEntries] = useState(
    () => Object.values(curStateRef.current.h3Renderer)[0].legend
  )

  const getVisibleLayers = () => {
    const { current: map } = mapRef

    if (!map) return []

    const zoom = map.getZoom()

    const visibleLayers = layers.filter(
      ({ id, source, minzoom, maxzoom }) =>
        (source === 'sites' || (source === 'h3' && id.endsWith('-fill'))) &&
        zoom >= minzoom &&
        zoom <= maxzoom
    )

    return visibleLayers
  }

  const handleCreateMap = useCallback((map) => {
    mapRef.current = map

    // show tooltip on hover
    const tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'left',
      offset: 20,
    })

    map.once('idle', () => {
      // update state once to trigger other components to update with map object
      setIsLoaded(() => true)
    })

    // add species range underneath everything else
    speciesLayers.forEach((speciesLayer) => {
      map.addLayer({
        ...speciesLayer,
        filter: ['==', 'species', speciesID],
      })
    })

    // add layers
    layers.forEach((layer) => {
      if (layer.id.startsWith('h3')) {
        const col = layer.id.split('-')[0]
        map.addLayer({
          ...layer,
          // setup initial filters on hexes
          filter: ['in', ['id'], ['literal', h3Ids[col]]],
          // setup initial fill color
          paint: layer.id.endsWith('-fill')
            ? {
                ...layer.paint,
                'fill-color': curStateRef.current.h3Renderer[col].fillExpr,
              }
            : layer.paint,
        })
      } else if (layer.id === 'sites') {
        map.addLayer({
          ...layer,
          // setup initial filter on sites
          filter: ['in', ['id'], ['literal', siteIds]],
        })
      } else {
        map.addLayer(layer)
      }
    })

    H3_COLS.forEach((col) => {
      Object.entries(h3Totals[col]).forEach(([hexId, total]) => {
        map.setFeatureState(
          { source: 'h3', sourceLayer: col, id: parseInt(hexId, 10) },
          {
            total,
            highlight: false,
          }
        )
      })

      const fillLayerId = `${col}-fill`

      map.on('mousemove', fillLayerId, ({ features: [feature], lngLat }) => {
        if (map.getZoom() < 3) {
          return
        }

        console.log('feature', feature)
        const { source, sourceLayer, id: featureId } = feature
        const hoverFeature = {
          source,
          sourceLayer,
          id: featureId,
        }

        /* eslint-disable-next-line no-param-reassign */
        map.getCanvas().style.cursor = 'pointer'

        // tooltip position follows mouse cursor
        tooltip
          .setLngLat(lngLat)
          .setHTML(`${formatNumber(h3Totals[col][featureId])} ${metricLabel}`)
          .addTo(map)

        if (hoverFeature !== hoverFeatureRef.current) {
          // unhighlight previous
          setFeatureHighlight(map, hoverFeatureRef.current, false)

          hoverFeatureRef.current = hoverFeature
          setFeatureHighlight(map, hoverFeatureRef.current, true)
        }
      })

      map.on('mouseout', fillLayerId, () => {
        setFeatureHighlight(map, hoverFeatureRef.current, false)
        hoverFeatureRef.current = null

        /* eslint-disable-next-line no-param-reassign */
        map.getCanvas().style.cursor = ''
        tooltip.remove()
      })
    })
  }, [])

  // useEffect(() => {
  //   const { current: map } = mapRef

  //   if (!(map && isLoaded)) return

  //   // update filter on layers
  //   H3_COLS.forEach((col) => {
  //     const layerIds = [`${col}-fill`, `${col}-outline`]
  //     layerIds.forEach((layerId) => {
  //       map.setFilter(layerId, ['in', ['id'], ['literal', h3Ids[col]]])
  //     })
  //   })

  //   map.setFilter('sites', ['in', ['id'], ['literal', siteIds]])

  //   // TODO: update rendering
  // }, [isLoaded, surveyedH3Ids, surveyedSiteIds])

  // const updateLegend = (detectorLegend = []) => {
  //   const entries = detectorLegend.slice()
  //   if (species) {
  //     entries.push(...legends.species())
  //   }

  //   setLegendEntries(entries)
  // }
  // const legendTitle =
  //   valueField === 'id'
  //     ? `Number of ${METRIC_LABELS[valueField]} that detected ${SPECIES[species].commonName}`
  //     : `Number of ${METRIC_LABELS[valueField]}`

  /**
   * Reset feature state on basemap change
   */
  const handleBasemapChange = useCallback(() => {
    const { current: map } = mapRef
    if (!map) {
      return
    }

    const {
      current: { h3Totals: curH3Totals, siteTotals: curSiteTotals },
    } = curStateRef

    H3_COLS.forEach((col) => {
      Object.entries(curH3Totals[col]).forEach(([hexId, total = 0]) => {
        map.setFeatureState(
          { source: 'h3', sourceLayer: col, id: parseInt(hexId, 10) },
          { total }
        )
      })
    })

    Object.entries(curSiteTotals).forEach(([siteId, total = 0]) => {
      map.setFeatureState(
        { source: 'sites', sourceLayer: 'sites', id: parseInt(siteId, 10) },
        { total }
      )
    })
  }, [])

  return (
    <Map
      onCreateMap={handleCreateMap}
      selectedFeature={selectedFeature}
      onBasemapChange={handleBasemapChange}
    >
      <Legend
        entries={legendEntries}
        title="TODO:"
        // subtitle={
        //   curStateRef.current.hasSpeciesFilter
        //     ? 'of the selected species'
        //     : null
        // }
      />
      {/* <Legend
        entries={legendEntries}
        title={legendTitle}
        note={
          detectors.length
            ? 'Map shows detector locations.  They may be clustered together if near each other.'
            : 'No detector locations visible.'
        }
      /> */}
    </Map>
  )
}

export default SpeciesMap

SpeciesMap.propTypes = {
  speciesID: PropTypes.string.isRequired,
}
