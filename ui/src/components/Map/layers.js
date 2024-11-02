import { getHighlightExpr } from './style'

const hexFillStub = {
  source: 'h3',
  type: 'fill',
  // filter: defined by specific data available,
  paint: {
    'fill-color': getHighlightExpr('#AAAAAA', '#ee7a14'),
    // 'fill-color': [
    //   'case',
    //   ['boolean', ['feature-state', 'highlight'], false],
    //   'red',
    //   'blue',
    // ],
    'fill-opacity': 0.75,
  },
}

const hexOutlineStub = {
  source: 'h3',
  type: 'line',
  // filter: defined by specific data available,
  paint: {
    'line-color': getHighlightExpr('#333333', '#ee7a14'),
    'line-width': getHighlightExpr(0.1, 2),
  },
}

export const layers = [
  {
    id: 'species-fill',
    source: 'species',
    'source-layer': 'species_ranges',
    type: 'fill',
    minzoom: 0,
    maxzoom: 22,
    // filter: set dynamically when loaded
    paint: {
      'fill-color': '#ee7a14', // highlight.5
      'fill-opacity': {
        stops: [
          [0, 0.1],
          [8, 0.05],
        ],
      },
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
      'line-color': '#ee7a14', // highlight.5
      'line-opacity': {
        stops: [
          [0, 0.1],
          [6, 0.5],
          [10, 0.75],
        ],
      },
      'line-width': {
        stops: [
          [0, 0.1],
          [6, 0.5],
          [10, 0.75],
        ],
      },
    },
  },
  {
    id: 'h3l4-fill',
    'source-layer': 'h3l4',
    minzoom: 0,
    maxzoom: 4.5,
    ...hexFillStub,
  },
  {
    id: 'h3l4-outline',
    'source-layer': 'h3l4',
    minzoom: 0,
    maxzoom: 4.5,
    ...hexOutlineStub,
  },
  {
    id: 'h3l5-fill',
    'source-layer': 'h3l5',
    minzoom: 4.5,
    maxzoom: 6.5,
    ...hexFillStub,
  },
  {
    id: 'h3l5-outline',
    'source-layer': 'h3l5',
    minzoom: 4.5,
    maxzoom: 6.5,
    ...hexOutlineStub,
  },
  {
    id: 'h3l6-fill',
    'source-layer': 'h3l6',
    minzoom: 6.5,
    maxzoom: 8,
    ...hexFillStub,
  },
  {
    id: 'h3l6-outline',
    'source-layer': 'h3l6',
    minzoom: 6.5,
    maxzoom: 8,
    ...hexOutlineStub,
  },
  {
    id: 'h3l7-fill',
    'source-layer': 'h3l7',
    minzoom: 8,
    maxzoom: 9.5,
    ...hexFillStub,
  },
  {
    id: 'h3l7-outline',
    'source-layer': 'h3l7',
    minzoom: 8,
    maxzoom: 9.5,
    ...hexOutlineStub,
  },
  {
    id: 'h3l8-fill',
    'source-layer': 'h3l8',
    minzoom: 9.5,
    maxzoom: 21,
    ...hexFillStub,
  },
  {
    id: 'h3l8-outline',
    'source-layer': 'h3l8',
    minzoom: 9.5,
    maxzoom: 21,
    ...hexOutlineStub,
  },
  // TODO: other hex levels
  // TODO: sites
  {
    id: 'sites',
    source: 'sites',
    'source-layer': 'sites',
    minzoom: 9.5,
    // minzoom: 0,
    maxzoom: 21,
    type: 'circle',
    // filter: TODO: filter to match dimension / species filters
    paint: {
      // TODO: use binary color for detections / non detections?
      // TODO: make dependent on zoom level
      'circle-radius': getHighlightExpr(4, 10),
      'circle-opacity': getHighlightExpr(0.75, 1),
      'circle-stroke-width': getHighlightExpr(1, 2),
      'circle-stroke-color': getHighlightExpr('#FFF', '#ee7a14'),
    },
  },
]
