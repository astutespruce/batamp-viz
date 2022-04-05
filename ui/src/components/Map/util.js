import geoViewport from '@mapbox/geo-viewport'
import { flatzip } from 'util/data'

/**
 * Calculate the appropriate center and zoom to fit the bounds, given padding.
 * @param {Array(number)} bounds - [xmin, ymin, xmax, ymax]
 * @param {int} width - width of the map node in pixels
 * @param {int} height - height of the map node in pixels
 * @param {float} padding - proportion of calculated zoom level to zoom out by, to pad the bounds
 */
export const getCenterAndZoom = (bounds, width, height, padding = 0) => {
  const viewport = geoViewport.viewport(
    bounds,
    [width, height],
    undefined,
    undefined,
    undefined,
    true
  )

  // Zoom out slightly to pad around bounds

  const zoom = Math.max(viewport.zoom - 1, 0) * (1 - padding)

  return { center: viewport.center, zoom }
}

export const toGeoJSONPoint = (record, x = 'lon', y = 'lat') => {
  const properties = {}
  Object.keys(record)
    .filter((f) => f !== x && f !== y)
    .forEach((f) => {
      properties[f] = record[f]
    })

  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [record[x], record[y]],
    },
    properties,
  }

  const { id } = record
  if (id !== undefined && id !== null) {
    feature.id = id
  }

  return feature
}

export const toGeoJSONPoints = (records) => ({
  type: 'FeatureCollection',
  features: records.map((r) => toGeoJSONPoint(r)),
})

export const boundsOverlap = (
  [xmin, ymin, xmax, ymax],
  [xmin2, ymin2, xmax2, ymax2]
) => ymax2 >= ymin && ymin2 <= ymax && xmax2 >= xmin && xmin2 <= xmax

// returns true if lat / lon is within bounds
export const withinBounds = ({ lat, lon }, [xmin, ymin, xmax, ymax]) =>
  lon >= xmin && lon <= xmax && lat >= ymin && lat <= ymax

/**
 * Convert a list of objects into mapbox step expression
 * @param {Array of objects} entries - list of objects to map to steps, each must have {threshold, property}
 * @param {string} property  - property to assign to each step, e.g., radius
 */
export const createSteps = (entries, property) => {
  const steps = []
  entries.forEach(({ threshold, ...entry }, i) => {
    steps.push(entry[property])

    // omit the last threshold
    if (i < entries.length - 1) {
      steps.push(threshold)
    }
  })
  return steps
}

/**
 * Calculate the bounds that contain the points: [xmin, ymin, xmax, ymax].
 * Note: only implemented for points!
 *
 * @param {Array} geometries - Array of point GeoJSON geometries
 */
export const calculateBounds = (geometries) =>
  geometries
    .map(({ coordinates }) => coordinates)
    .reduce(
      ([xmin, ymin, xmax, ymax], [lng, lat]) => [
        xmin === null ? lng : Math.min(xmin, lng),
        ymin === null ? lat : Math.min(ymin, lat),
        xmax === null ? lng : Math.max(xmax, lng),
        ymax === null ? lat : Math.max(ymax, lat),
      ],
      [null, null, null, null]
    )

// TODO: memoize!
/**
 * Construct Mapbox GL style expression to interpolate linearly between
 * values of domain (min, max) against the range (minOutput, maxOutput).
 * fallback is used when max value is 0 or if min > 0
 *
 * @param {Object} - options
 */
export const interpolateExpr = ({
  property,
  domain,
  range,
  fallback,
  hasZero = true,
}) => {
  const [min, max] = domain

  if (max === 0) {
    return fallback
  }

  const interpolateExpression = [
    'interpolate',
    ['linear'],
    ['get', property],
    ...flatzip(domain, range),
  ]

  if (hasZero) {
    // if there is nothing to interpolate between, return first output value
    if (min === max) {
      // const value =
      //   typeof range[0] === 'number'
      //     ? (range[1] - range[0]) / 3 + range[0]
      //     : range[0]

      return ['case', ['==', ['get', property], 0], fallback, range[0]]
    }

    return [
      'case',
      ['==', ['get', property], 0],
      fallback,
      interpolateExpression,
    ]
  }

  return interpolateExpression
}

/**
 * Calculate the maximum value of a property across an array of features.
 * If no features are present, this returns fallback value
 *
 * @param {Array} features - GeoJSON features
 * @param {String} property - name of property
 * @param {Number} fallback - value to use when there are no features
 */
export const maxProperty = (features, property, fallback = null) => {
  const values = features
    .map(({ properties: { [property]: v } }) => v)
    .filter((v) => !isNaN(v))

  if (values.length) {
    return Math.max(...values)
  }

  return fallback
}
