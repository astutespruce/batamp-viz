/* eslint-disable max-len,no-underscore-dangle,camelcase */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useCrossfilter } from 'components/Crossfilter'
import { H3_COLS } from 'config'

import {
  layers,
  hexColors,
  hexColorGradient,
  getHexColorExpr,
  defaultHexFillColor,
  Map,
  mapboxgl,
  setFeatureHighlight,
} from 'components/Map'

// TODO: props
const SpeciesOccurrenceMap = ({ onMapLoad, children, ...props }) => {
  const mapRef = useRef(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const hoverFeatureRef = useRef(null)
  // TODO:
  //   const selectedFeatureRef = useRef(selectedFeature)

  // FIXME:
  // const valueFieldRef = useRef(valueField)
  //   const hasFilterRef = useRef(hasFilters)
  // const detectorsRef = useRef(detectors)

  // const [legendEntries, setLegendEntries] = useState(
  //   species ? legends.species() : []
  // )

  const {
    state: {
      metric: { label: metricLabel },
      hasFilters,
      h3Totals,
      h3Ids,
      siteIds,
    },
  } = useCrossfilter()

  const h3TotalsRef = useRef(h3Totals)

  const getH3ColorExpr = (totals) => {
    const values = Object.values(totals)
    const maxValue = Math.max(...values)
    if (values.length === 0 || maxValue === 0) {
      return defaultHexFillColor
    }

    return getHexColorExpr([0, maxValue])
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

    // TODO: add layers, etc
    map.once('idle', () => {
      // update state once to trigger other components to update with map object
      setIsLoaded(() => true)
    })

    // add layers
    layers
      .filter(({ id }) => !id.startsWith('species'))
      .forEach((layer) => {
        map.addLayer(layer)
      })

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

      const fillLayerId = `${col}-fill`

      map.once('idle', () => {
        map.setPaintProperty(
          fillLayerId,
          'fill-color',
          getH3ColorExpr(h3Totals[col])
        )
      })

      map.on('mousemove', fillLayerId, ({ features: [feature], lngLat }) => {
        if (map.getZoom() < 3) {
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
          current: { [col]: { [featureId]: total = 0 } = { [featureId]: 0 } },
        } = h3TotalsRef

        // tooltip position follows mouse cursor
        tooltip.setLngLat(lngLat).setHTML(`${total} ${metricLabel}`).addTo(map)

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

    // let consumers of map know that it is now fully loaded
    map.once('idle', () => onMapLoad(map))
  }, [])

  useEffect(() => {
    const { current: map } = mapRef

    if (!(map && isLoaded)) return

    h3TotalsRef.current = h3Totals

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

    // TODO: set feature state to totals and update rendering

    H3_COLS.forEach((col) => {
      Object.entries(h3Totals[col]).forEach(([hexId, total = 0]) => {
        map.setFeatureState(
          { source: 'h3', sourceLayer: col, id: parseInt(hexId, 10) },
          { total }
        )
      })

      map.setPaintProperty(
        `${col}-fill`,
        'fill-color',
        getH3ColorExpr(h3Totals[col])
      )
    })
  }, [isLoaded, hasFilters, h3Totals, h3Ids, siteIds])

  //   const updateLegend = (detectorLegend = []) => {
  //     const entries = detectorLegend.slice()
  //     if (species) {
  //       entries.push(...legends.species())
  //     }

  //     setLegendEntries(entries)
  //   }
  // const legendTitle =
  //   valueField === 'id'
  //     ? `Number of ${METRIC_LABELS[valueField]} that detected ${SPECIES[species].commonName}`
  //     : `Number of ${METRIC_LABELS[valueField]}`

  return (
    <Map onCreateMap={handleCreateMap} {...props}>
      {/* <Legend
        entries={legendEntries}
        title={legendTitle}
        note={
          detectors.length
            ? 'Map shows detector locations.  They may be clustered together if near each other.'
            : 'No detector locations visible.'
        }
      /> */}
      {/* <Legend {...getLegend()} /> */}
      {children}
    </Map>
  )
}

SpeciesOccurrenceMap.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onMapLoad: PropTypes.func,
}

SpeciesOccurrenceMap.defaultProps = {
  children: null,
  onMapLoad: () => {},
}

export default SpeciesOccurrenceMap
