module.exports = {
  siteMetadata: {
    siteUrl: `https://explorer.batamp.databasin.org`,
    title: `North American Bat Acoustic Monitoring Explorer`,
    shortTitle: `Bat Monitoring Explorer`,
    description: `Data exploration tool for bat acoustic monitoring data across North America.`,
    author: `Brendan C. Ward, Conservation Biology Institute`,
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
    sentryDSN: process.env.SENTRY_DSN,
    mapboxToken: process.env.MAPBOX_API_TOKEN,
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
        trackingId: process.env.GOOGLE_ANALYTICS_ID,
        anonymize: true,
      },
    },

    {
      resolve: `@gatsby-contrib/gatsby-plugin-elasticlunr-search`,
      options: {
        // Fields to index
        fields: [`title`, `path`],
        resolvers: {
          // Json: {
          //   title: // TODO
          //   path: node => node.path,
          // },
          SitePage: {
            title: node =>
              node.isCreatedByStatefulCreatePages && node.fields
                ? node.fields.title
                : null,
            path: node =>
              node.isCreatedByStatefulCreatePages && node.fields
                ? node.path
                : null,
          },
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
