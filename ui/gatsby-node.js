const path = require('path-browserify')

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
  haba: 9,
  idph: 10,
  labl: 11,
  labo: 12,
  laci: 13,
  laeg: 14,
  lain: 15,
  lano: 16,
  lase: 17,
  laxa: 18,
  lecu: 19,
  leni: 20,
  leye: 21,
  maca: 22,
  mome: 23,
  myar: 24,
  myau: 25,
  myca: 26,
  myci: 27,
  myev: 28,
  mygr: 29,
  myke: 30,
  myle: 31,
  mylu: 32,
  myoc: 33,
  myse: 34,
  myso: 35,
  myth: 36,
  myve: 37,
  myvo: 38,
  myyu: 39,
  nyfe: 40,
  nyhu: 41,
  nyma: 42,
  pahe: 43,
  pesu: 44,
  tabr: 45,
}

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
      `).then((result) => {
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
