import { theme } from '../../style/theme'

const TILE_HOST = 'https://tiles.batamp.databasin.org'
// const TILE_HOST = 'http://localhost:8001'

export const MINRADIUS = 4
export const MAXRADIUS = 18
export const DARKESTCOLOR = '#74a9cf'
export const LIGHTESTCOLOR = '#045a8d'

export const config = {
  // Mapbox public token.  TODO: migrate to .env setting
  accessToken:
    'pk.eyJ1IjoiYmN3YXJkIiwiYSI6InJ5NzUxQzAifQ.CVyzbyOpnStfYUQ_6r8AgQ',
  center: [-91.426, 51.711],
  zoom: 2.3,
  minZoom: 1.75,
  styles: ['light-v9', 'satellite-streets-v11'],
  padding: 0.1, // padding around bounds as a proportion
}

export const sources = {
  // grids: {
  //   type: 'vector',
  //   tiles: [`${TILE_HOST}/services/grids/tiles/{z}/{x}/{y}.pbf`],
  //   minzoom: 1,
  //   maxzoom: 8,
  // },
  // admin: {
  //   type: 'vector',
  //   tiles: [`${TILE_HOST}/services/na_admin1/tiles/{z}/{x}/{y}.pbf`],
  //   minzoom: 0,
  //   maxzoom: 9,
  // },
  detectors: {
    type: 'geojson',
    data: {},
    cluster: true,
    clusterMaxZoom: 24, // show clusters at lowest zoom since there may be multiple detectors at a site
    clusterRadius: MAXRADIUS,
    clusterProperties: {
      //   detections: ['+', ['get', 'detections']],
      //   nights: ['+', ['get', 'nights']],
      //   detectors: ['+', ['get', 'nights']],
      total: ['+', ['get', 'total']],
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
  // {
  //   id: 'admin1-outline',
  //   type: 'line',
  //   source: 'admin',
  //   'source-layer': 'na_admin1',
  //   paint: {
  //     'line-width': {
  //       base: 0.1,
  //       stops: [[1, 0.1], [5, 0.25], [6, 1], [8, 2], [10, 3]],
  //     },
  //     'line-opacity': {
  //       stops: [[1, 0.1], [5, 0.5], [8, 1]],
  //     },
  //     'line-color': '#004d84', // theme.colors.primary.500
  //   },
  // },
  // {
  //   id: 'admin1-fill',
  //   type: 'fill',
  //   source: 'admin',
  //   'source-layer': 'admin1',
  //   // filter: ['>', ['get', 'total'], 0],
  //   // filter: ['>', ['feature-state', 'total'], 0],
  //   paint: {
  //     'fill-color': [
  //       'interpolate',
  //       ['linear'],
  //       ['feature-state', 'total'],
  //       0,
  //       'rgba(0,0,0,0)',
  //       1,
  //       '#F00',
  //       100,
  //       '#00F',
  //     ],
  //     'fill-opacity': 0.5,
  //   },
  // },

  // {
  //   id: 'detectors-cluster-label',
  //   type: 'symbol',
  //   source: 'detectors',
  //   filter: ['has', 'point_count'],
  //   layout: {
  //     'text-field': '{point_count_abbreviated}', // only show when displaying detector locations and not values
  //     // 'text-field': '{total}',
  //     'text-size': 10,
  //     'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
  //   },
  //   paint: {
  //     'text-color': '#FFFFFF',
  //     'text-opacity': 1,
  //     'text-halo-color': '#000',
  //     'text-halo-blur': 1,
  //     'text-halo-width': 0.5,
  //   },
  // },
]

// [
//   {
//     id: 'na_grts',
//     source: 'grids',
//     'source-layer': 'na_grts',
//     minzoom: 5,
//     maxzoom: 22,
//     type: 'line',
//     layout: {
//       visibility: 'none',
//     },
//     paint: {
//       'line-width': {
//         base: 0.1,
//         stops: [[5, 0.1], [8, 0.5], [10, 1], [12, 3]],
//       },
//       'line-opacity': {
//         stops: [[5, 0.1], [7, 0.5], [10, 1]],
//       },
//       'line-color': '#004d84', // theme.colors.primary.500
//     },
//   },
//   {
//     id: 'na_50km',
//     source: 'grids',
//     'source-layer': 'na_50km',
//     minzoom: 1,
//     maxzoom: 22,
//     type: 'line',
//     layout: {
//       visibility: 'none',
//     },
//     paint: {
//       'line-width': {
//         base: 0.1,
//         stops: [[1, 0.1], [5, 0.25], [6, 1], [8, 2], [10, 3]],
//       },
//       'line-opacity': {
//         stops: [[1, 0.1], [5, 0.5], [8, 1]],
//       },
//       'line-color': '#004d84', // theme.colors.primary.500
//     },
//   },
//   {
//     id: 'na_100km',
//     source: 'grids',
//     'source-layer': 'na_100km',
//     minzoom: 1,
//     maxzoom: 22,
//     type: 'line',
//     layout: {
//       visibility: 'none',
//     },
//     paint: {
//       'line-width': {
//         base: 0.1,
//         stops: [[1, 0.1], [5, 0.25], [6, 1], [8, 2], [10, 3]],
//       },
//       'line-opacity': {
//         stops: [[1, 0.1], [5, 0.5], [8, 1]],
//       },
//       'line-color': '#004d84', // theme.colors.primary.500
//     },
//   },
// ],

// id: "source"
export const speciesSource = {
  type: 'vector',
  tiles: [`${TILE_HOST}/services/species_ranges/tiles/{z}/{x}/{y}.pbf`],
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
