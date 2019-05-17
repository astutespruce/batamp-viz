module.exports = {
  siteMetadata: {
    siteUrl: `https://explorer.batamp.databasin.org`,
    title: `North American Bat Acoustic Monitoring Explorer`,
    shortTitle: `Bat Monitoring Explorer`,
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
        // name the top-level type after the filename
        typeName: ({ node }) => `${node.name}Json`,
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
          // Site pages deliberately not searchable
          // SitePage: {
          //   title: node =>
          //     node.isCreatedByStatefulCreatePages && node.fields
          //       ? node.fields.title
          //       : null,
          //   path: node =>
          //     node.isCreatedByStatefulCreatePages && node.fields
          //       ? node.path
          //       : null,
          // },
        },
        // only include nodes that have a path defined
        filter: node => !!node.path,
      },
    },

    // TODO: hook up MDX pages?
    // {
    //   resolve: `gatsby-mdx`,
    //   options: {
    //     // defaultLayouts: {
    //     //   default: require.resolve('./src/templates/MDXTemplate.jsx'),
    //     // },
    //     gatsbyRemarkPlugins: [
    //       {
    //         resolve: `gatsby-remark-images`,
    //         options: {
    //           showCaptions: true,
    //           linkImagesToOriginal: false,
    //           quality: 95,
    //           maxWidth: 960,
    //           withWebp: true,
    //         },
    //       },
    //     ],
    //   },
    // },
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     name: `mdxpages`,
    //     path: `${__dirname}/src/mdx`,
    //   },
    // },
    //
  ],
}
