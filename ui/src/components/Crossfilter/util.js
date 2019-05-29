import { Map } from 'immutable'

// Get counts based on current filters
// Only for non-internal filters
// TODO: filter dimensions for internal vs not elsewhere, not here
export const countByDimension = dimensions => {
  return Map(
    Object.values(dimensions)
      .filter(({ config: { internal } }) => !internal)
      .map(({ group, config: { field } }) => {
        // Convert the array of key:count returned by crossfilter to a Map
        const counts = Map(
          group()
            .all()
            .map(d => Object.values(d))
        )
        return [field, counts]
      })
  )
}

export const countFiltered = cf =>
  cf
    .groupAll()
    .reduceCount()
    .value()

// TODO: filter dimensions for internal vs not elsewhere, not here
export const sumByDimension = (dimensions, valueField) => {
  return Map(
    Object.values(dimensions)
      .filter(({ config: { internal } }) => !internal)
      .forEach(({ group, config: { field } }) => {
        const sums = Map(
          group()
            .reduceSum(d => d.get(valueField))
            .all()
            .map(d => Object.values(d))
        )
        return [field, sums]
      })
  )
}
