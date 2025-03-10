// @refresh reset
/* eslint-disable max-len,no-underscore-dangle,camelcase */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useCrossfilter } from 'components/Crossfilter'
import { H3_COLS } from 'config'
import { isEqual } from 'util/data'

import {
  layers,
  getHexRenderer,
  Map,
  mapboxgl,
  setFeatureHighlight,
  Legend,
} from 'components/Map'

const SpeciesOccurrenceMap = ({
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
      metric: {
        field: valueField,
        type: valueType = 'count',
        label: metricLabel,
      },
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
        getHexRenderer(Object.values(h3Totals[col]), valueType),
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
        const {
          source,
          sourceLayer,
          id: featureId,
          layer: { minzoom, maxzoom = 21 },
        } = feature

        // prevent hover when there is a selected feature
        if (
          selectedFeatureRef.current !== null &&
          selectedFeatureRef.current.sourceLayer === 'sites'
        ) {
          return
        }
        const zoom = map.getZoom()

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
            hasSpeciesFilter,
          },
        } = curStateRef

        // tooltip position follows mouse cursor
        tooltip
          .setLngLat(lngLat)
          .setHTML(
            `<b>${total}</b> ${metricLabel} in this area${hasSpeciesFilter ? ' (of the selected species)' : ''}`
          )
          .addTo(map)

        const hoverFeature = {
          source,
          sourceLayer,
          id: featureId,
        }

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

      map.on('mouseout', fillLayerId, () => {
        /* eslint-disable-next-line no-param-reassign */
        map.getCanvas().style.cursor = ''
        tooltip.remove()

        // prevent clear of highlight of selected feature
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
      const newLegendEntries = []
      visibleLayers.forEach(({ id, source, getLegend }) => {
        if (source === 'h3') {
          const col = id.split('-')[0]
          newLegendEntries.push(...curStateRef.current.h3Renderer[col].legend)
        } else if (source === 'sites' && zoom > 7) {
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
      h3Totals,
      h3Renderer: Object.fromEntries(
        H3_COLS.map((col) => [
          col,
          getHexRenderer(Object.values(h3Totals[col])),
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

    map.once('idle', () => {
      map.triggerRepaint()
    })

    const visibleLayers = getVisibleLayers()
    const newLegendEntries = []
    visibleLayers.forEach(({ id, source, getLegend }) => {
      if (source === 'h3') {
        const col = id.split('-')[0]
        newLegendEntries.push(...curStateRef.current.h3Renderer[col].legend)
      } else if (source === 'sites' && map.getZoom() > 7) {
        newLegendEntries.push(...getLegend(valueField, metricLabel))
      }
    })
    setLegendEntries(newLegendEntries)
  }, [
    isLoaded,
    valueField,
    valueType,
    metricLabel,
    hasFilters,
    filters,
    h3Totals,
    h3Ids,
    siteIds,
    siteTotals,
  ])

  useEffect(() => {
    const { current: map } = mapRef
    if (!map) {
      return
    }

    setFeatureHighlight(map, selectedFeatureRef.current, false)

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
        title={`Number of${curStateRef.current.hasSpeciesFilter ? ' selected' : ''} species detected`}
        maxWidth="150px"
      />
    </Map>
  )
}

export default SpeciesOccurrenceMap

SpeciesOccurrenceMap.propTypes = {
  selectedFeature: PropTypes.object,
  onSelectFeature: PropTypes.func.isRequired,
  onCreateMap: PropTypes.func.isRequired,
}

SpeciesOccurrenceMap.defaultProps = {
  selectedFeature: null,
}
