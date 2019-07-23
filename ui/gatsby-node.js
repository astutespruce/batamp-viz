const path = require('path')

const SPECIES2ID = {
  anpa: 0,
  chme: 1,
  cora: 2,
  coto: 3,
  epfu: 4,
  eufl: 5,
  euma: 6,
  eupe: 7,
  euun: 8,
  idph: 9,
  labl: 10,
  labo: 11,
  laci: 12,
  laeg: 13,
  lain: 14,
  lano: 15,
  lase: 16,
  laxa: 17,
  lecu: 18,
  leni: 19,
  maca: 20,
  mome: 21,
  myar: 22,
  myau: 23,
  myca: 24,
  myci: 25,
  myev: 26,
  mygr: 27,
  myke: 28,
  myle: 29,
  mylu: 30,
  myoc: 31,
  myse: 32,
  myso: 33,
  myth: 34,
  myve: 35,
  myvo: 36,
  myyu: 37,
  nyfe: 38,
  nyhu: 39,
  nyma: 40,
  pahe: 41,
  pesu: 42,
  tabr: 43,
  haba: 44,
}

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
            context: { species, speciesId: SPECIES2ID[species] },
          })
        })
      })
    )
  })
}
