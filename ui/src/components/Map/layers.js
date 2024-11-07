import { interpolateYlGnBu, schemeYlGnBu } from 'd3-scale-chromatic'
import {
  scaleOrdinal,
  scaleLinear,
  scaleBand,
  scaleQuantize,
  scaleThreshold,
} from 'd3-scale'

import { getHighlightExpr } from './style'

export const defaultHexFillColor = '#AAAAAA'
export const defaultHexOutlineColor = '#333333'

// use 20% stops for interpolated colors
// export const hexColors = [...Array(6).keys()]
//   .map((d) => d / 5)
//   .map(interpolateYlGnBu)

// fill missing colors
const colorScheme = schemeYlGnBu
colorScheme[1] = [colorScheme[5][3]]
colorScheme[2] = [colorScheme[5][0], colorScheme[5][3]]
console.log('colorScheme', colorScheme)

// FIXME: remove if possible
export const hexColors = colorScheme[5]

// export const hexColorGradient = () => {
//   const stops = hexColors
//     .map((color, i) => `${color} ${(i / (hexColors.length - 1)) * 100}%`)
//     .join(', ')
//   return `linear-gradient(90deg, ${stops})`
// }

export const getHexColorExpr = (scale) => {
  // FIXME:
  window.scaleOrdinal = scaleOrdinal
  window.scaleLinear = scaleLinear
  window.scaleBand = scaleBand
  window.scaleQuantize = scaleQuantize
  window.scaleThreshold = scaleThreshold
  window.schemeYlGnBu = schemeYlGnBu

  if (scale[1] === 0) {
    return defaultHexFillColor
  }

  const colorExpr = ['interpolate', ['linear'], ['feature-state', 'total']]
  const colorScale = scaleQuantize([1, scale[1]], hexColors)
  colorScale.ticks(5).forEach((tick) => {
    colorExpr.push(...[tick, colorScale(tick)])
  })

  return [
    'case',
    [
      'any',
      ['==', ['feature-state', 'total'], 0],
      ['==', ['feature-state', 'total'], null],
    ],
    defaultHexFillColor,
    colorExpr,
  ]
}

const hexFillStub = {
  source: 'h3',
  type: 'fill',
  // filter: defined by specific data available,
  paint: {
    'fill-color': defaultHexFillColor,
    'fill-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      0.75,
      14,
      0.5,
      16,
      0,
    ],
  },
  getLegend: (metricLabel, scale) => {
    const entries = []

    if (scale[1] > 0) {
      const colorScale = scaleQuantize([1, scale[1]], hexColors)
      if (scale[1] < 5) {
        for (let i = scale[1]; i >= 1; i -= 1) {
          entries.push({
            id: `count${i}`,
            type: 'fill',
            label: `${i} ${metricLabel}`,
            color: colorScale(i),
            borderColor: `${defaultHexOutlineColor}33`,
            borderWidth: 1,
            opacity: 0.75,
          })
        }
      } else {
        const stops = colorScale
          .ticks(5)
          .map((t) => `${colorScale(t)} ${100 * ((t - scale[0]) / scale[1])}%`)
          .join(', ')

        // gradient is in descending order
        entries.push({
          id: 'speciesCounts',
          type: 'gradient',
          label: [`${scale[1]} ${metricLabel}`, `1 ${metricLabel}`],
          height: '4rem',
          color: `linear-gradient(0deg, ${stops})`,
          borderColor: '#AAAAAA',
          borderWidth: 1,
          opacity: 0.8,
        })
      }
    }

    entries.push({
      id: '0count',
      type: 'fill',
      label: `0 ${metricLabel}`,
      color: defaultHexFillColor,
      borderColor: `${defaultHexOutlineColor}33`,
      borderWidth: 1,
      opacity: 0.75,
    })

    return entries
  },
}

const hexOutlineStub = {
  source: 'h3',
  type: 'line',
  // filter: defined by specific data available,
  paint: {
    'line-color': getHighlightExpr(defaultHexOutlineColor, '#ee7a14'),
    'line-width': [
      'interpolate',
      ['linear'],
      ['zoom'],
      8,
      getHighlightExpr(0.1, 2),
      10,
      getHighlightExpr(0.5, 2),
      14,
      getHighlightExpr(1.5, 3),
    ],
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 14, 1, 16, 0],
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
    id: 'h3l3-fill',
    'source-layer': 'h3l3',
    minzoom: 0,
    maxzoom: 3,
    ...hexFillStub,
  },
  {
    id: 'h3l3-outline',
    'source-layer': 'h3l3',
    minzoom: 0,
    maxzoom: 3,
    ...hexOutlineStub,
  },

  {
    id: 'h3l4-fill',
    'source-layer': 'h3l4',
    minzoom: 3,
    maxzoom: 4.5,
    ...hexFillStub,
  },
  {
    id: 'h3l4-outline',
    'source-layer': 'h3l4',
    minzoom: 3,
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
    maxzoom: 16,
    ...hexFillStub,
  },
  {
    id: 'h3l8-outline',
    'source-layer': 'h3l8',
    minzoom: 9.5,
    maxzoom: 16,
    ...hexOutlineStub,
  },
  {
    id: 'sites',
    source: 'sites',
    'source-layer': 'sites',
    minzoom: 7,
    maxzoom: 21,
    type: 'circle',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7,
        getHighlightExpr(1, 10),
        8,
        getHighlightExpr(1.5, 10),
        10,
        getHighlightExpr(3, 10),
        14,
        getHighlightExpr(6, 10),
      ],
      'circle-opacity': getHighlightExpr(0.75, 1),
      'circle-stroke-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7,
        getHighlightExpr(0.25, 2),
        10,
        getHighlightExpr(1, 2),
      ],
      'circle-stroke-color': getHighlightExpr('#FFF', '#e31a1c'),
      'circle-color': getHighlightExpr(
        [
          'case',
          [
            'any',
            ['==', ['feature-state', 'total'], 0],
            ['==', ['feature-state', 'total'], null],
          ],
          '#000000',
          '#c51b8a',
        ],
        '#ee7a14'
      ),
    },
    getLegend: (metricLabel) => {},
  },
]
