// load appropriate dotenv file
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
})

// since we are searching on species names and codes that include common English
// articles, we need to clear the stop words used by elasticlunr
// or these prevent species from being found during autocomplete in search widgets
const elasticlunr = require(`elasticlunr`)
elasticlunr.clearStopWords()

module.exports = {
  siteMetadata: {
    siteUrl: `https://batamp.org`,
    title: `Bat Acoustic Monitoring Visualization Tool`,
    description: `Data exploration tool for bat acoustic monitoring data across North America.`,
    author: `Brendan C. Ward`,
    contactEmail: 'bcward@astutespruce.com',
    sentryDSN: process.env.GATSBY_SENTRY_DSN,
    mapboxToken: process.env.GATSBY_MAPBOX_API_TOKEN,
  },
  plugins: [
    `gatsby-plugin-image`,
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
    {
      resolve: `gatsby-plugin-theme-ui`,
      options: {
        injectColorFlashScript: false,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
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
    `gatsby-plugin-catch-links`,
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: process.env.GATSBY_GOOGLE_ANALYTICS_ID
          ? [process.env.GATSBY_GOOGLE_ANALYTICS_ID]
          : [],
        gtagConfig: {
          anonymize_ip: true,
        },
        pluginConfig: {
          head: true,
          respectDNT: true,
        },
      },
    },
  ],
}
