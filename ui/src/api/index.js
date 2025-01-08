import { fromArrow, op, escape } from 'arquero'

import { MONTHS, MONTH_LABELS, H3_COLS, SPECIES_ID } from 'config'
import { indexBy, groupBy } from 'util/data'

const fetchFeather = async (url) => {
  const response = await fetch(url)
  if (response.status !== 200) {
    throw new Error(`Failed request to ${url}: ${response.statusText}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  return fromArrow(bytes)
}

export const loadOccurrenceData = async () => {
  const [detectorsTable, occurrenceTable] = await Promise.all([
    fetchFeather('/data/detectors.feather'),
    fetchFeather('/data/spp_occurrence.feather'),
  ])

  const detectors = detectorsTable.objects()

  return {
    detectorsIndex: indexBy(detectors, 'id'),
    detectorsBySite: groupBy(detectors, 'siteId'),
    occurrenceTable: occurrenceTable
      // unpack speciesId to 4 letter codes
      .derive({ species: escape((d) => SPECIES_ID[d.species]) })
      .join(
        detectorsTable.select([
          'id',
          'source',
          'siteId',
          'admin1Name',
          ...H3_COLS,
        ]),
        ['detId', 'id']
      ),
  }
}

export const loadSingleSpeciesData = async (speciesID) => {
  const [detectorsTable, rawSpeciesTable] = await Promise.all([
    fetchFeather('/data/detectors.feather'),
    fetchFeather(`/data/species/${speciesID}.feather`),
  ])

  const speciesTable = rawSpeciesTable.join(
    detectorsTable.select([
      'id',
      'source',
      'siteId',
      'admin1Name',
      'countType',
      ...H3_COLS,
    ]),
    ['detId', 'id']
  )

  const { admin1Name: admin1Names, year: years } = speciesTable
    .rollup({
      admin1Name: op.array_agg_distinct('admin1Name'),
      year: op.array_agg_distinct('year'),
    })
    .objects()[0]

  admin1Names.sort()
  years.sort()

  const filters = [
    {
      field: 'month',
      title: 'Seasonality',
      isOpen: true,
      vertical: true,
      values: MONTHS,
      labels: MONTH_LABELS.map((m) => m.slice(0, 3)),
      aggregateById: true,
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: true,
      vertical: true,
      values: years,
      labels:
        years.length > 6
          ? years.map((y) => `'${y.toString().slice(2)}`)
          : years,
    },
    {
      field: 'admin1Name',
      title: 'State / Province',
      isOpen: false,
      sort: true,
      hideEmpty: true,
      values: admin1Names,
    },
    {
      field: 'source',
      title: 'Data source',
      isOpen: false,
      labels: [
        'Bat Acoustic Monitoring Portal (BatAMP)',
        'North American Bat Monitoring Program (NABat)',
      ],
      values: ['batamp', 'nabat'],
    },
    {
      field: 'countType',
      title: 'Was activity or presence monitored?',
      isOpen: false,
      values: ['p', 'a'],
      labels: ['Presence', 'Activity'],
      help: 'Some detectors monitored only the presence of a species on a given night, whereas other detectors monitored total activity during the night.',
    },
  ]

  return {
    detectorsIndex: indexBy(detectorsTable.objects(), 'id'),
    // TODO: create lookup table of detectors by siteID
    speciesTable,
    filters,
  }
}
