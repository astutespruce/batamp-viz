import { siteMetadata } from '../../../gatsby-config'

export const MINRADIUS = 4
export const MAXRADIUS = 18
export const NONDETECTIONCOLOR = '#49ac9f'
export const LIGHTESTCOLOR = '#d2d5ea'
export const DARKESTCOLOR = '#020d57'

export const config = {
  accessToken: siteMetadata.mapboxToken,
  center: [-91.426, 51.711],
  zoom: 2.3,
  minZoom: 1.75,
  styles: ['light-v9', 'satellite-streets-v11', 'streets-v11'],
  padding: 0.1, // padding around bounds as a proportion
}

export const sources = {
  species: {
    type: 'pmtiles',
    url: '/tiles/species_ranges.pmtiles',
    minzoom: 0,
    maxzoom: 6,
  },
  sites: {
    type: 'pmtiles',
    url: '/tiles/sites.pmtiles',
    minzoom: 0,
    maxzoom: 12,
  },
  h3: {
    type: 'pmtiles',
    url: '/tiles/h3.pmtiles',
    minzoom: 0,
    maxzoom: 12,
  },
}
