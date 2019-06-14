import fs from 'fs'
import path from 'path'
import render from 'mbgl-renderer'
import dotenv from 'dotenv'

import { SPECIES } from '../ui/config/constants'

dotenv.config()
const token = process.env.MAPBOX_TOKEN
if (!token) {
  throw new Error(
    'Mapbox token is not defined, you must have this in MAPBOX_TOKEN in the .env file in this directory.'
  )
}

const outDir = '../ui/src/images/maps'
const tilePath = path.join(__dirname, '../tiles')
const center = [-110.43457, 50.120578]
const zoom = 0
const width = 175
const height = 150

const allSpecies = Object.keys(SPECIES)

const style = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        `https://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=${token}`,
      ],
      tileSize: 256,
    },
    species: {
      type: 'vector',
      url: 'mbtiles://species_ranges',
      tileSize: 256,
      minzoom: 0,
      maxzoom: 6,
    },
  },
  layers: [
    { id: 'basemap', type: 'raster', source: 'basemap' },
    {
      id: 'species-fill',
      source: 'species',
      'source-layer': 'species_ranges',
      type: 'fill',
      minzoom: 0,
      maxzoom: 22,
      // filter: set dynamically when loaded
      paint: {
        'fill-color': '#ee7a14',
        'fill-opacity': 0.75,
      },
    },
  ],
}

allSpecies.forEach(species => {
  console.log(`Creating map for ${species}`)

  style.layers[1].filter = ['==', 'species', species]

  render(style, width, height, { token, center, zoom, tilePath }).then(data => {
    fs.writeFileSync(`${outDir}/${species}.png`, data)
  })
})
