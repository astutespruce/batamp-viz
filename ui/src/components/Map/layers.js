import { schemeYlGnBu } from 'd3-scale-chromatic'
import { scaleQuantile } from 'd3-scale'

import { formatNumber } from 'util/format'
import { getHighlightExpr } from './style'

export const defaultHexFillColor = '#AAAAAA'
export const defaultHexOutlineColor = '#333333'

// fill missing color ramps so that we can do this for
const hexColorScheme =
  structuredClone !== undefined
    ? structuredClone(schemeYlGnBu)
    : [...schemeYlGnBu]
// if only 1 value, use least intense color
hexColorScheme[1] = [hexColorScheme[5][0]]
// if only 3 values, use least and most intense colors
hexColorScheme[2] = [hexColorScheme[5][0], hexColorScheme[5][3]]
// update color scheme for 3 values so that lowest is always least extreme
/* eslint-disable-next-line prefer-destructuring */
hexColorScheme[3][0] = hexColorScheme[5][0]

// maximum number of color bins allowed in legend
const MAX_BINS = 7

export const getHexRenderer = (values) => {
  let maxValue = 0
  const nonzeroValues = values.filter((d) => {
    if (d > 0) {
      maxValue = Math.max(maxValue, d)
      return true
    }
    return false
  })

  const legendEntryStub = {
    type: 'fill',
    borderColor: `${defaultHexOutlineColor}33`,
    borderWidth: 1,
    opacity: 0.75,
  }

  const legendElements = [
    {
      ...legendEntryStub,
      id: 'value0',
      label: `0`,
      color: defaultHexFillColor,
    },
  ]

  if (maxValue === 0) {
    return {
      // only value is 0, render as grey
      fillExpr: defaultHexFillColor,
      legend: legendElements,
    }
  }

  let binColorExpr = []
  if (maxValue <= MAX_BINS) {
    const numBins = maxValue
    const colors = hexColorScheme[numBins]
    // use match expr to match values exactly
    binColorExpr = ['match', ['feature-state', 'total']]
    Array(numBins)
      .keys()
      .forEach((bin) => {
        binColorExpr.push(bin + 1)
        binColorExpr.push(colors[bin])
        legendElements.unshift({
          ...legendEntryStub,
          id: `value${bin + 1}`,
          label: `${formatNumber(bin + 1)}`,
          color: colors[bin],
        })
      })
    binColorExpr.push(defaultHexFillColor)
  } else {
    const range = Array.from(Array(MAX_BINS)).map((d, i) => i + 1)
    // round to integer, extract unique values, and make sure first bin starts at 1
    let quantiles = scaleQuantile()
      .domain(nonzeroValues)
      .range(range)
      .quantiles()
      .map(Math.round)
    quantiles = quantiles.filter((d, i) => i === 0 || d !== quantiles[i - 1])
    if (quantiles[0] > 1) {
      quantiles.unshift(1)
    }

    const bins = quantiles.map((d, i) =>
      i < quantiles.length - 1 ? [d, quantiles[i + 1] - 1] : [d, maxValue]
    )

    const colors = hexColorScheme[bins.length]
    binColorExpr = ['step', ['feature-state', 'total']]
    bins.forEach(([min, max], i) => {
      if (i > 0) {
        binColorExpr.push(min)
      }
      binColorExpr.push(colors[i])
      const label =
        max > min
          ? `${formatNumber(min)} to ${formatNumber(max)}`
          : formatNumber(min)
      legendElements.unshift({
        ...legendEntryStub,
        id: `value${i + 1}`,
        label,
        color: colors[i],
      })
    })
  }

  return {
    fillExpr: [
      'case',
      [
        'any',
        ['==', ['feature-state', 'total'], 0],
        ['==', ['feature-state', 'total'], null],
      ],
      defaultHexFillColor,
      binColorExpr,
    ],
    legend: legendElements,
  }
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
    getLegend: (valueField, label) => {
      const legendStub = {
        type: 'circle',
        radius: 6,
      }

      if (valueField === 'detectors') {
        return [
          {
            ...legendStub,
            id: 'detectorWithValue',
            color: '#c51b8a',
            label: '>=1 detectors at site',
          },
        ]
      }

      return [
        {
          ...legendStub,
          id: 'detectorWithValue',
          color: '#c51b8a',
          label: `detector with >=1 ${label}`,
        },
        {
          ...legendStub,
          id: 'detector0Value',
          color: '#000000',
          label: `detector with no ${label}`,
        },
      ]
    },
  },
]

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
]
