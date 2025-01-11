// @refresh reset
/* eslint-disable max-len,no-underscore-dangle,camelcase */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useCrossfilter } from 'components/Crossfilter'
import { H3_COLS, SPECIES } from 'config'
import { isEqual } from 'util/data'
import { formatNumber, quantityLabel } from 'util/format'

import {
  layers,
  speciesLayers,
  getHexRenderer,
  Map,
  mapboxgl,
  setFeatureHighlight,
  Legend,
} from 'components/Map'

const SpeciesMap = ({
  speciesID,
  selectedFeature,
  onSelectFeature,
  onCreateMap,
}) => {
  const mapRef = useRef(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const hoverFeatureRef = useRef(null)
  const selectedFeatureRef = useRef(null)

  const {
    state: {
      metric,
      hasFilters,
      filters,
      h3Totals,
      h3Ids,
      siteIds,
      siteTotals,
    },
  } = useCrossfilter()

  const curStateRef = useRef({
    metric,
    h3Totals,
    h3Renderer: Object.fromEntries(
      H3_COLS.map((col) => [col, getHexRenderer(Object.values(h3Totals[col]))])
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

      // force repaint to sync up styling based on feature state
      map.once('idle', () => {
        map.triggerRepaint()
      })

      map.on('mousemove', fillLayerId, ({ features: [feature], lngLat }) => {
        // prevent hover when there is a selected feature
        if (selectedFeatureRef.current !== null) {
          return
        }

        const zoom = map.getZoom()

        const {
          source,
          sourceLayer,
          id: featureId,
          layer: { minzoom, maxzoom = 21 },
        } = feature
        // make sure that layer is actually visible; not clear why the event
        // fires when features are not yet visible but appears related to
        // using floating point divisions between layers
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
          },
        } = curStateRef

        // tooltip position follows mouse cursor
        tooltip
          .setLngLat(lngLat)
          .setHTML(
            `<b>${formatNumber(total)}</b> ${quantityLabel(curStateRef.current.metric.label, total)}<br/>in this area`
          )
          .addTo(map)

        const hoverFeature = {
          source,
          sourceLayer,
          id: featureId,
        }

        if (hoverFeature !== hoverFeatureRef.current) {
          // unhighlight previous
          setFeatureHighlight(map, hoverFeatureRef.current, false)

          hoverFeatureRef.current = hoverFeature
          setFeatureHighlight(map, hoverFeatureRef.current, true)
        }
      })

      map.on('mouseout', fillLayerId, () => {
        // prevent clear of highlight of selected feature
        if (selectedFeatureRef.current !== null) {
          return
        }

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
        },
      } = curStateRef

      // tooltip position follows mouse cursor
      tooltip
        .setLngLat(lngLat)
        .setHTML(
          `<b>${formatNumber(total)}</b> ${quantityLabel(curStateRef.current.metric.label, total)}<br/>at this site`
        )
        .addTo(map)

      if (hoverFeature !== hoverFeatureRef.current) {
        if (
          !isEqual(hoverFeatureRef.current, selectedFeatureRef.current, [
            'sourceLayer',
            'id',
          ])
        ) {
          // unhighlight previous
          setFeatureHighlight(map, hoverFeatureRef.current, false)
        }

        hoverFeatureRef.current = hoverFeature
        setFeatureHighlight(map, hoverFeatureRef.current, true)
      }
    })

    map.on('mouseout', 'sites', () => {
      /* eslint-disable-next-line no-param-reassign */
      map.getCanvas().style.cursor = ''
      tooltip.remove()

      if (
        isEqual(hoverFeatureRef.current, selectedFeatureRef.current, [
          'sourceLayer',
          'id',
        ])
      ) {
        return
      }

      setFeatureHighlight(map, hoverFeatureRef.current, false)
      hoverFeatureRef.current = null
    })

    const clickLayers = layers
      .filter(({ id }) => id.endsWith('-fill') || id === 'sites')
      .map(({ id }) => id)

    map.on('click', ({ point }) => {
      // always clear out prior selected feature and hover feature
      setFeatureHighlight(map, selectedFeatureRef.current, false)
      selectedFeatureRef.current = null
      setFeatureHighlight(map, hoverFeatureRef.current, false)
      hoverFeatureRef.current = null

      const zoom = map.getZoom()
      const features = map
        .queryRenderedFeatures(point, {
          layers: clickLayers,
        })
        // filter to those actually visible at zoom
        .filter(({ layer: { id: layerId, minzoom, maxzoom = 21 } }) =>
          layerId === 'sites' ? zoom >= 10 : zoom >= minzoom && zoom <= maxzoom
        )

      const [feature = null] = features

      onSelectFeature(feature)
    })

    map.on('zoomend', () => {
      const zoom = map.getZoom()
      const visibleLayers = getVisibleLayers()

      const {
        current: {
          metric: { field: valueField, label: metricLabel },
        },
      } = curStateRef

      const newLegendEntries = []
      visibleLayers.forEach(({ id, source, getLegend }) => {
        if (source === 'h3') {
          const col = id.split('-')[0]
          let entries = [...curStateRef.current.h3Renderer[col].legend]
          if (valueField === 'detectors') {
            entries = entries.slice(0, -1) // remove 0 value
          }
          newLegendEntries.push(...entries)
        } else if (getLegend) {
          newLegendEntries.push(...getLegend(valueField, metricLabel))
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

    onCreateMap(map)
  }, [])

  /**
   * Update layer filter and rendering when filters change
   */
  useEffect(() => {
    const { current: map } = mapRef

    if (!(map && isLoaded)) return

    curStateRef.current = {
      metric,
      h3Totals,
      h3Renderer: Object.fromEntries(
        H3_COLS.map((col) => [
          col,
          getHexRenderer(Object.values(h3Totals[col])),
        ])
      ),
      siteTotals,
      siteMax: Math.max(0, Math.max(...Object.values(siteTotals))),
    }

    map.setFilter('sites', ['in', ['id'], ['literal', siteIds]])
    Object.entries(siteTotals).forEach(([siteId, total = 0]) => {
      map.setFeatureState(
        { source: 'sites', sourceLayer: 'sites', id: parseInt(siteId, 10) },
        { total }
      )
    })

    // update filter, data, and renderer on layers
    H3_COLS.forEach((col) => {
      const filterExpr = ['in', ['id'], ['literal', h3Ids[col]]]
      map.setFilter(`${col}-fill`, filterExpr)
      map.setFilter(`${col}-outline`, filterExpr)

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

    map.once('idle', () => {
      map.triggerRepaint()
    })

    const visibleLayers = getVisibleLayers()

    const {
      current: {
        metric: { field: valueField, label: metricLabel },
      },
    } = curStateRef

    const newLegendEntries = []
    visibleLayers.forEach(({ id, source, getLegend }) => {
      if (source === 'h3') {
        const col = id.split('-')[0]
        let entries = [...curStateRef.current.h3Renderer[col].legend]

        if (valueField === 'detectors') {
          // remove 0 value from the end
          entries = entries.slice(0, -1)
        }
        newLegendEntries.push(...entries)
      } else if (getLegend) {
        newLegendEntries.push(...getLegend(valueField, metricLabel))
      }
    })
    setLegendEntries(newLegendEntries)
  }, [
    metric,
    isLoaded,
    hasFilters,
    filters,
    h3Totals,
    h3Ids,
    siteIds,
    siteTotals,
  ])

  useEffect(() => {
    if (selectedFeature === null) {
      return
    }

    const { current: map } = mapRef
    if (!map) {
      return
    }

    selectedFeatureRef.current = selectedFeature
    setFeatureHighlight(map, selectedFeatureRef.current, true)
  }, [selectedFeature])

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
        title={`Number of ${curStateRef.current.metric.label}`}
        note={
          curStateRef.current.metric.field === 'detectors'
            ? `limited to detectors that surveyed for ${SPECIES[speciesID].commonName}`
            : ''
        }
      />
    </Map>
  )
}

export default SpeciesMap

SpeciesMap.propTypes = {
  speciesID: PropTypes.string.isRequired,
  selectedFeature: PropTypes.object,
  onSelectFeature: PropTypes.func.isRequired,
  onCreateMap: PropTypes.func.isRequired,
}

SpeciesMap.defaultProps = {
  selectedFeature: null,
}
