import { fromArrow, op, escape } from 'arquero'

import { MONTHS, MONTH_LABELS, H3_COLS, SPECIES_ID, SPECIES } from 'config'

const fetchFeather = async (url) => {
  const response = await fetch(url)
  if (response.status !== 200) {
    throw new Error(`Failed request to ${url}: ${response.statusText}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  return fromArrow(bytes)
}

const loadData = async () => {
  const [detectorsTable, rawSpeciesTable] = await Promise.all([
    fetchFeather('/data/detectors.feather'),
    fetchFeather('/data/spp_detections.feather'),
  ])

  return {
    detectorsTable,
    // join in species codes and detector info
    allSpeciesTable: rawSpeciesTable
      .derive({
        species: escape((d) => SPECIES_ID[d.species]),
      })
      .join(
        detectorsTable.select([
          'id',
          'source',
          'countType',
          'siteId',
          'lat',
          'lon',
          'admin1Name',
          ...H3_COLS,
        ]),
        ['detId', 'id']
      ),
  }
}

export const loadOccurrenceData = async () => {
  const { detectorsTable, allSpeciesTable } = await loadData()

  const {
    admin1Name: admin1Names,
    species,
    years,
  } = allSpeciesTable
    .rollup({
      admin1Name: op.array_agg_distinct('admin1Name'),
      species: op.array_agg_distinct('species'),
      years: op.array_agg_distinct('year'),
    })
    .objects()[0]

  admin1Names.sort()
  years.sort()

  // sort species by commonName
  const sortedSpecies = species
    .map((id) => {
      const { commonName, sciName } = SPECIES[id]
      return { id, commonName, label: `${commonName} (${sciName})` }
    })
    .slice()
    .sort(({ commonName: leftName }, { commonName: rightName }) =>
      leftName < rightName ? -1 : 1
    )

  const filters = [
    {
      field: 'species',
      title: 'Species detected',
      isOpen: false,
      hideEmpty: true,
      sort: true,
      values: sortedSpecies.map(({ id }) => id),
      labels: sortedSpecies.map(({ label }) => label),
    },
    {
      field: 'month',
      title: 'Seasonality',
      isOpen: false,
      vertical: true,
      values: MONTHS,
      labels: MONTH_LABELS.map((m) => m.slice(0, 3)),
    },
    {
      field: 'year',
      title: 'Year',
      isOpen: false,
      vertical: true,
      values: years,
      labels: years.map((y) => `'${y.toString().slice(2)}`),
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
  ]

  return {
    detectorsTable,
    allSpeciesTable,
    filters,
  }
}

export const loadSingleSpeciesData = async (speciesID) => {
  const { detectorsTable: rawDetectorsTable, allSpeciesTable } =
    await loadData()

  const selectedSpeciesTable = allSpeciesTable.filter(
    escape((d) => d.species === speciesID)
  )

  // only show detectors that monitored this species
  const detIds = selectedSpeciesTable
    .rollup({ detId: op.array_agg_distinct('detId') })
    .array('detId')[0]
  const detectorsTable = rawDetectorsTable.filter(
    escape((d) => op.includes(detIds, d.id))
  )

  const { admin1Name: admin1Names, years } = selectedSpeciesTable
    .rollup({
      admin1Name: op.array_agg_distinct('admin1Name'),
      years: op.array_agg_distinct('year'),
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
    detectorsTable,
    allSpeciesTable,
    selectedSpeciesTable,
    filters,
  }
}
