import { createSteps } from './util'

const TILE_HOST = 'https://tiles.batamp.databasin.org'

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
  detectors: {
    type: 'geojson',
    data: {},
    // cluster: true,
    maxzoom: 15,
    clusterMaxZoom: 15, // show clusters at lowest zoom since there may be multiple detectors at a site
    clusterRadius: 24,
    clusterProperties: {
      detections: ['+', ['get', 'detections']],
      nights: ['+', ['get', 'nights']],
    },
  },
}

// const defaultRadius = 6
// const clusters = [
//   {
//     threshold: 10,
//     // label: '< 10 estuaries',
//     color: '#74a9cf',
//     borderColor: '#2b8cbe',
//     radius: defaultRadius,
//   },
//   {
//     threshold: 100,
//     // label: '10 - 100 estuaries',
//     color: '#2b8cbe',
//     borderColor: '#045a8d',
//     radius: 20,
//   },
//   {
//     threshold: Infinity,
//     // label: '> 100 estuaries',
//     color: '#045a8d',
//     borderColor: '#000',
//     radius: 25,
//   },
// ]

// TODO: linear interopolation?
// const clusterRadii = createSteps(
//   [
//     { threshold: 0, radius: 4 },
//     { threshold: 100, radius: 6 },
//     { threshold: 100, radius: 6 },
//     { threshold: 500, radius: 14 },
//   ],
//   'radius'
// )

// for detections - with clustering:
const circleRadius = [
  'interpolate',
  ['linear'],
  ['get', 'detections'],
  1,
  6,
  10000,
  10,
  1000000,
  20,
]

const circleColor = [
  'interpolate',
  ['linear'],
  ['get', 'detections'],
  0,
  '#AAA',
  1,
  '#74a9cf',
  10000,
  '#2b8cbe',
  1000000,
  '#045a8d',
]

// for detections without clustering
// const circleRadius = [
//   'interpolate',
//   ['linear'],
//   ['get', 'detections'],
//   1,
//   6,
//   1000,
//   10,
//   100000,
//   20,
// ]

// const circleColor = [
//   'interpolate',
//   ['linear'],
//   ['get', 'detections'],
//   0,
//   '#AAA',
//   1,
//   '#74a9cf',
//   1000,
//   '#2b8cbe',
//   100000,
//   '#045a8d',
// ]

// for detectors
// const circleRadius = [
//   'interpolate',
//   ['linear'],
//   ['get', 'point_count'],
//   1,
//   6,
//   10,
//   10,
//   50,
//   20,
// ]

// const circleColor = [
//   'interpolate',
//   ['linear'],
//   ['get', 'point_count'],
//   0,
//   '#AAA',
//   1,
//   '#74a9cf',
//   10,
//   '#2b8cbe',
//   50,
//   '#045a8d',
// ]

export const layers = [
  {
    id: 'detectors-clusters',
    type: 'circle',
    source: 'detectors',
    filter: ['has', 'point_count'], // point_count field added by mapbox GL
    paint: {
      'circle-color': circleColor,
      'circle-stroke-width': 1,
      'circle-radius': circleRadius,
    },
  },
  {
    id: 'detectors-points', // unclustered points
    type: 'circle',
    source: 'detectors',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': circleColor,
      // 'circle-radius': circleRadius,
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  },
  {
    id: 'detectors-cluster-label',
    type: 'symbol',
    source: 'detectors',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}', // only show when displaying detector locations and not values
      'text-size': 10,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-opacity': 1,
      'text-halo-color': '#000',
      'text-halo-blur': 1,
      'text-halo-width': 0.5,
    },
  },
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
