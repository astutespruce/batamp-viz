const path = require('path')
// const { createFilePath } = require('gatsby-source-filesystem')

/**
 * Enable absolute imports with `/src` as root.
 *
 * See: https://github.com/alampros/gatsby-plugin-resolve-src/issues/4
 */
exports.onCreateWebpackConfig = ({ actions, stage, loaders }) => {
  const config = {
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
  }

  // when building HTML, window is not defined, so Leaflet causes the build to blow up
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

exports.createPages = ({ graphql, actions: { createPage } }) => {
  return new Promise((resolve, reject) => {
    resolve(
      graphql(
        `
          {
            allSpeciesJson {
              edges {
                node {
                  id
                  species
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.error(result.errors)
          reject(result.errors)
          return
        }

        const speciesTemplate = path.resolve(`./src/templates/Species.jsx`)
        result.data.allSpeciesJson.edges.forEach(({ node: { species } }) => {
          createPage({
            path: `/species/${species}`,
            component: speciesTemplate,
            context: { species },
          })
        })
      })
    )
  })
}
