export const getHighlightExpr = (defaultExpr, highlightExpr) => [
  'case',
  [
    'any',
    ['boolean', ['feature-state', 'highlight'], false],
    ['boolean', ['feature-state', 'selected'], false],
  ],
  highlightExpr,
  defaultExpr,
]

export const setFeatureHighlight = (map, feature, highlight) => {
  if (feature === null) {
    return
  }
  map.setFeatureState(feature, {
    highlight,
  })
}
