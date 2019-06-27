import { interpolate, interpolateRgb } from 'd3-interpolate'

import { formatNumber } from 'util/format'
import { theme } from 'style'
import {siteMetadata} from '../../../gatsby-config'


export const MINRADIUS = 4
export const MAXRADIUS = 18
export const NONDETECTIONCOLOR = '#49ac9f'
export const LIGHTESTCOLOR = '#d2d5ea'
export const DARKESTCOLOR = '#020d57'

export const config = {  
  accessToken: siteMetadata.mapboxToken,
  center: [-91.426, 51.711],
  zoom: 2.3,
  minZoom: 1.75,
  styles: ['light-v9', 'satellite-streets-v11', 'streets-v11'],
  padding: 0.1, // padding around bounds as a proportion
}

export const sources = {
  detectors: {
    type: 'geojson',
    data: {},
    cluster: true,
    clusterMaxZoom: 10, // show clusters at lowest zoom since there may be multiple detectors at a site
    clusterRadius: 12,
    clusterProperties: {
      total: ['+', ['get', 'total']],
      max: ['max', ['get', 'total']],
    },
  },
}

export const layers = [
  {
    id: 'detectors-clusters',
    type: 'circle',
    source: 'detectors',
    filter: ['has', 'point_count'], // point_count field added by mapbox GL
    paint: {
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'highlight-cluster'], false],
        1,
        0.75,
      ],
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'highlight-cluster'], false],
        2,
        1,
      ],
      'circle-stroke-color': [
        'case',
        ['boolean', ['feature-state', 'highlight-cluster'], false],
        theme.colors.highlight[500],
        '#FFF',
      ],
      // other props specified dynamically
    },
  },
  {
    id: 'detectors-points', // unclustered points
    type: 'circle',
    source: 'detectors',
    filter: ['!has', 'point_count'],
    paint: {
      'circle-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'highlight'], false],
          ['boolean', ['feature-state', 'selected'], false],
        ],
        1,
        0.75,
      ],
      'circle-stroke-width': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'highlight'], false],
          ['boolean', ['feature-state', 'selected'], false],
        ],
        2,
        1,
      ],
      'circle-stroke-color': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'highlight'], false],
          ['boolean', ['feature-state', 'selected'], false],
        ],
        theme.colors.highlight[500],
        '#FFF',
      ],
      // other props specified dynamically
    },
  },
  
]


// id: "source"
export const speciesSource = {
  type: 'vector',
  tiles: ['https://tiles.databasin.org/services/batamp/species_ranges/tiles/{z}/{x}/{y}.pbf'],
  minzoom: 0,
  maxzoom: 6,
}

export const speciesLayers = [
  {
    id: 'species-fill',
    source: 'species',
    'source-layer': 'species_ranges',
    type: 'fill',
    minzoom: 0,
    maxzoom: 22,
    // filter: set dynamically when loaded
    paint: {
      'fill-color': theme.colors.highlight[500],
      'fill-opacity': { stops: [[0, 0.1], [8, 0.05]] },
    },
  },
  {
    id: 'species-outline',
    source: 'species',
    'source-layer': 'species_ranges',
    type: 'line',
    minzoom: 0,
    maxzoom: 22,
    // filter: set dynamically when loaded
    paint: {
      'line-color': theme.colors.highlight[500],
      'line-opacity': { stops: [[0, 0.1], [6, 0.5], [10, 0.75]] },
      'line-width': { stops: [[0, 0.1], [6, 0.5], [10, 0.75]] },
    },
  },
]

export const legends = {
  species: () => [
    {
      color: `${theme.colors.highlight[500]}33`,
      borderColor: `${theme.colors.highlight[500]}33`,
      borderWidth: 1,
      label: 'Species range',
    },
  ],
  // TODO: make it based on properties in the map
  detectors: upperValue => {
    const radiusInterpolator = interpolate(MINRADIUS, MAXRADIUS)
    const colorInterpolator = interpolateRgb(DARKESTCOLOR, LIGHTESTCOLOR)

    const entries = []

    if (upperValue === 1) {
      entries.push({
        type: 'circle',
        radius: MINRADIUS,
        label: '1',
        color: DARKESTCOLOR,
      })
    } else if (upperValue > 1) {
      let breaks = []
      if (upperValue > 2 && upperValue <= 4) {
        breaks = [0.5]
      } else if (upperValue > 4) {
        breaks = [0.66, 0.33]
      }

      entries.push(
        {
          type: 'circle',
          radius: MAXRADIUS,
          label: `≥ ${formatNumber(upperValue, 0)}`,
          color: LIGHTESTCOLOR,
        },
        ...breaks.map(b => ({
          type: 'circle',
          label: `${formatNumber(upperValue * b, 0)}`,
          radius: radiusInterpolator(b),
          color: colorInterpolator(b),
        })),
        { type: 'circle', radius: MINRADIUS, label: '1', color: DARKESTCOLOR }
      )
    }

    entries.push({
      type: 'circle',
      radius: MINRADIUS,
      label: 'Not detected',
      color: NONDETECTIONCOLOR,
    })

    return entries
  },
}
