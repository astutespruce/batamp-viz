// since we are searching on species names and codes that include common English
// articles, we need to clear the stop words used by elasticlunr
// or these prevent species from being found during autocomplete in search widgets
const elasticlunr = require(`elasticlunr`)
elasticlunr.clearStopWords()

module.exports = {
  siteMetadata: {
    siteUrl: `https://visualize.batamp.databasin.org`,
    title: `Bat Acoustic Monitoring Visualization Tool`,
    description: `Data exploration tool for bat acoustic monitoring data across North America.`,
    author: `Brendan C. Ward, Conservation Biology Institute`,
    googleAnalyticsId: process.env.GATSBY_GOOGLE_ANALYTICS_ID,
    sentryDSN: process.env.GATSBY_SENTRY_DSN,
    mapboxToken: process.env.GATSBY_MAPBOX_API_TOKEN,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-styled-components`,
      options: {
        displayName: process.env.NODE_ENV !== `production`,
        fileName: false,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `json`,
        path: `${__dirname}/data`,
      },
    },
    {
      resolve: `gatsby-transformer-json`,
      options: {
        // lump all the species JSON files into a single data structure,
        // keep the others separate based on their filenames
        typeName: ({ node }) =>
          node.relativeDirectory === 'speciesTS'
            ? 'speciesTSJson'
            : `${node.name}Json`,
      },
    },
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `./config/typography.js`,
      },
    },
    `gatsby-plugin-catch-links`,
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: process.env.GATSBY_GOOGLE_ANALYTICS_ID,
        anonymize: true,
      },
    },

    {
      resolve: `@gatsby-contrib/gatsby-plugin-elasticlunr-search`,
      options: {
        // Fields to index
        fields: [`path`, `commonName`, `sciName`, `species`],
        resolvers: {
          speciesJson: {
            commonName: ({ commonName }) => commonName,
            sciName: ({ sciName }) => sciName,
            species: ({ species }) => species,
            path: ({ species }) => `/species/${species}`,
          },
        },
        // only include species
        filter: node => node.species,
      },
    },
  ],
}
