// @refresh reset
/* eslint-disable max-len,no-underscore-dangle,camelcase */
import React, { useRef, useState, useCallback, useEffect } from 'react'

import { useCrossfilter } from 'components/Crossfilter'
import { H3_COLS } from 'config'

import {
  layers,
  getHexRenderer,
  Map,
  mapboxgl,
  setFeatureHighlight,
  Legend,
} from 'components/Map'

const SpeciesOccurrenceMap = () => {
  const mapRef = useRef(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const hoverFeatureRef = useRef(null)
  // TODO:
  //   const selectedFeatureRef = useRef(selectedFeature)

  const {
    state: {
      metric: { label: metricLabel },
      hasFilters,
      filters,
      h3Totals,
      h3Ids,
      siteIds,
      siteTotals,
    },
  } = useCrossfilter()

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
    hasSpeciesFilter: filters && filters.species && filters.species.size > 0,
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

    // add layers
    layers.forEach((layer) => {
      if (layer.id.startsWith('h3') && layer.id.endsWith('-fill')) {
        const col = layer.id.split('-')[0]
        map.addLayer({
          ...layer,
          paint: {
            ...layer.paint,
            'fill-color': curStateRef.current.h3Renderer[col].fillExpr,
          },
        })
      } else {
        map.addLayer(layer)
      }
    })

    // set values for each hex in each level
    H3_COLS.forEach((col) => {
      Object.entries(h3Totals[col]).forEach(([hexId, total = 0]) => {
        map.setFeatureState(
          { source: 'h3', sourceLayer: col, id: parseInt(hexId, 10) },
          {
            total,
            highlight: false,
          }
        )
      })

      Object.entries(siteTotals).forEach(([siteId, total = 0]) => {
        map.setFeatureState(
          { source: 'sites', sourceLayer: 'sites', id: parseInt(siteId, 10) },
          { total, highlight: false }
        )
      })

      const fillLayerId = `${col}-fill`

      // force repaint to sync up styling based on feature state
      map.once('idle', () => {
        map.triggerRepaint()
      })

      map.on('mousemove', fillLayerId, ({ features: [feature], lngLat }) => {
        const zoom = map.getZoom()

        const { source, sourceLayer, id: featureId } = feature
        const hoverFeature = {
          source,
          sourceLayer,
          id: featureId,
        }

        // make sure that layer is actually visible; not clear why the event
        // fires when features are not yet visible but appears related to
        // using floating point divisions between layers
        const { minzoom, maxzoom } = map.getLayer(`${sourceLayer}-fill`)
        if (zoom < minzoom || zoom > maxzoom) {
          return
        }

        /* eslint-disable-next-line no-param-reassign */
        map.getCanvas().style.cursor = 'pointer'

        const {
          current: {
            h3Totals: {
              [col]: { [featureId]: total = 0 } = { [featureId]: 0 },
            },
            hasSpeciesFilter,
          },
        } = curStateRef

        // tooltip position follows mouse cursor
        tooltip
          .setLngLat(lngLat)
          .setHTML(
            `<b>${total}</b> ${metricLabel}<br/>in this area${hasSpeciesFilter ? '<br/>(of the selected species)' : ''}`
          )
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

    map.on('mousemove', 'sites', ({ features: [feature], lngLat }) => {
      if (map.getZoom() < 10) {
        return
      }

      /* eslint-disable-next-line no-param-reassign */
      map.getCanvas().style.cursor = 'pointer'

      const { source, sourceLayer, id: featureId } = feature
      const hoverFeature = {
        source,
        sourceLayer,
        id: featureId,
      }

      const {
        current: {
          siteTotals: { [featureId]: total = 0 },
          hasSpeciesFilter,
        },
      } = curStateRef

      // tooltip position follows mouse cursor
      // TODO: count of detectors? (would need to respect filter)
      tooltip
        .setLngLat(lngLat)
        .setHTML(
          `<b>${total}</b> ${metricLabel}<br/>at this site${hasSpeciesFilter ? '<br/>(of the selected species)' : ''}`
        )
        .addTo(map)

      if (hoverFeature !== hoverFeatureRef.current) {
        // unhighlight previous
        setFeatureHighlight(map, hoverFeatureRef.current, false)

        hoverFeatureRef.current = hoverFeature
        setFeatureHighlight(map, hoverFeatureRef.current, true)
      }
    })

    map.on('mouseout', 'sites', () => {
      setFeatureHighlight(map, hoverFeatureRef.current, false)
      hoverFeatureRef.current = null

      /* eslint-disable-next-line no-param-reassign */
      map.getCanvas().style.cursor = ''
      tooltip.remove()
    })

    map.on('zoomend', () => {
      const zoom = map.getZoom()

      const visibleLayers = getVisibleLayers()
      const newLegendEntries = []
      visibleLayers.forEach(({ id, source, getLegend }) => {
        if (source === 'h3') {
          const col = id.split('-')[0]
          newLegendEntries.push(...curStateRef.current.h3Renderer[col].legend)
        } else if (getLegend) {
          newLegendEntries.push(...getLegend(metricLabel))
        }
      })
      setLegendEntries(newLegendEntries)

      // Make sure that layer is still visible or hide tooltip / highlight if no
      // longer in view.
      const { current: hoverFeature } = hoverFeatureRef

      if (hoverFeature && hoverFeature.source === 'h3') {
        const { maxzoom } = map.getLayer(`${hoverFeature.sourceLayer}-fill`)
        if (zoom > maxzoom) {
          setFeatureHighlight(map, hoverFeatureRef.current, false)
          hoverFeatureRef.current = null

          /* eslint-disable-next-line no-param-reassign */
          map.getCanvas().style.cursor = ''
          tooltip.remove()
        }
      }
    })
  }, [])

  /**
   * Update layer filter and rendering when filters change
   */
  useEffect(() => {
    const { current: map } = mapRef

    if (!(map && isLoaded)) return

    curStateRef.current = {
      h3Totals,
      h3Renderer: Object.fromEntries(
        H3_COLS.map((col) => [
          col,
          getHexRenderer(
            Math.max(0, Math.max(...Object.values(h3Totals[col])))
          ),
        ])
      ),
      siteTotals,
      siteMax: Math.max(0, Math.max(...Object.values(siteTotals))),
      hasSpeciesFilter: filters && filters.species && filters.species.size > 0,
    }

    // update filter on layers
    if (hasFilters) {
      H3_COLS.forEach((col) => {
        const layerIds = [`${col}-fill`, `${col}-outline`]
        layerIds.forEach((layerId) => {
          map.setFilter(layerId, ['in', ['id'], ['literal', h3Ids[col]]])
        })
      })

      map.setFilter('sites', ['in', ['id'], ['literal', siteIds]])
    } else {
      // unset filters
      H3_COLS.forEach((col) => {
        const layerIds = [`${col}-fill`, `${col}-outline`]
        layerIds.forEach((layerId) => {
          map.setFilter(layerId, null)
        })
      })

      map.setFilter('sites', null)
    }

    H3_COLS.forEach((col) => {
      // update feature state
      Object.entries(h3Totals[col]).forEach(([hexId, total = 0]) => {
        map.setFeatureState(
          { source: 'h3', sourceLayer: col, id: parseInt(hexId, 10) },
          { total }
        )
      })

      map.setPaintProperty(
        `${col}-fill`,
        'fill-color',
        curStateRef.current.h3Renderer[col].fillExpr
      )
    })

    Object.entries(siteTotals).forEach(([siteId, total = 0]) => {
      map.setFeatureState(
        { source: 'sites', sourceLayer: 'sites', id: parseInt(siteId, 10) },
        { total }
      )
    })

    const visibleLayers = getVisibleLayers()
    const newLegendEntries = []
    visibleLayers.forEach(({ id, source, getLegend }) => {
      if (source === 'h3') {
        const col = id.split('-')[0]
        newLegendEntries.push(...curStateRef.current.h3Renderer[col].legend)
      } else if (getLegend) {
        newLegendEntries.push(...getLegend(metricLabel))
      }
    })
    setLegendEntries(newLegendEntries)
  }, [
    isLoaded,
    metricLabel,
    hasFilters,
    filters,
    h3Totals,
    h3Ids,
    siteIds,
    siteTotals,
  ])

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
    <Map onCreateMap={handleCreateMap} onBasemapChange={handleBasemapChange}>
      <Legend
        entries={legendEntries}
        title={`Number of${curStateRef.current.hasSpeciesFilter ? ' selected' : ''} species detected`}
        maxWidth="150px"
      />
    </Map>
  )
}

export default SpeciesOccurrenceMap
