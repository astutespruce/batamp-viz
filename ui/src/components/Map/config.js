import { createSteps } from './util'

const TILE_HOST = 'https://tiles.batamp.databasin.org'

export const MINRADIUS = 4
export const MAXRADIUS = 12
export const LIGHTESTCOLOR = '#74a9cf'
export const DARKESTCOLOR = '#045a8d'

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
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1,
    },
  },
  {
    id: 'detectors-points', // unclustered points
    type: 'circle',
    source: 'detectors',
    filter: ['!has', 'point_count'],
    paint: {
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  },
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
