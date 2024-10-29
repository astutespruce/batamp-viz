const path = require('path-browserify')

exports.onCreateWebpackConfig = ({ actions, stage, loaders, plugins }) => {
  const config = {
    resolve: {
      alias: {
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        zlib: require.resolve('browserify-zlib'),
      },
      fallback: {
        assert: false,
        fs: false,
        crypto: false,
      },

      // Enable absolute imports with `/src` as root.
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
    plugins: [
      plugins.provide({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  }

  // when building HTML, window is not defined, so mapbox-gl causes the build to blow up
  if (stage === 'build-html') {
    config.module = {
      rules: [
        {
          test: /mapbox-gl/,
          use: loaders.null(),
        },
      ],
    }
  }

  actions.setWebpackConfig(config)
}

exports.onCreateNode = ({ node, actions: { createNodeField } }) => {
  // if the page originated from JSX, add a title based on the path
  if (node.isCreatedByStatefulCreatePages) {
    const pathParts = node.path.split('/')
    let [title] = pathParts.slice(pathParts.length - 2, pathParts.length - 1)
    if (title && title.length) {
      title = `${title.slice(0, 1).toUpperCase()}${title.slice(1)}`
    } else {
      title = null
    }
    createNodeField({ node, name: 'title', value: title })
  }
}

exports.createPages = ({ graphql, actions: { createPage } }) =>
  new Promise((resolve, reject) => {
    resolve(
      graphql(`
        query {
          summaryJson {
            speciesTable {
              species
            }
          }
        }
      `).then((result) => {
        if (result.errors) {
          console.error(result.errors)
          reject(result.errors)
          return
        }

        const speciesTemplate = path.resolve(`./src/templates/Species.jsx`)
        result.data.summaryJson.speciesTable.species.forEach((species) => {
          createPage({
            path: `/species/${species}`,
            component: speciesTemplate,
            context: { species },
          })
        })
      })
    )
  })
