import { summaryStats, MONTHS, MONTH_LABELS, SPECIES } from 'config'

const {
  admin1,
  years,
  speciesTable: { species },
} = summaryStats

const sortedSpecies = species.slice().sort()

export const filters = [
  {
    field: 'species',
    title: 'Species detected',
    isOpen: false,
    hideEmpty: true,
    sort: true,
    values: sortedSpecies,
    labels: sortedSpecies.map((id) => {
      const { commonName, sciName } = SPECIES[id]
      return `${commonName} (${sciName})`
    }),
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
    values: admin1,
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
