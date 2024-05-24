import { useState } from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { Index } from 'elasticlunr'

const useIndex = () => {
  const data = useStaticQuery(graphql`
    query SearchIndexQuery {
      siteSearchIndex {
        index
      }
    }
  `)

  // Wrap setup of the index and query function in setState
  // to memoize it
  /* eslint-disable-next-line no-unused-vars */
  const [queryFunc, _] = useState(() => {
    const searchIndex = Index.load(data.siteSearchIndex.index)
    const { documentStore } = searchIndex
    return (query) =>
      searchIndex
        .search(query, {
          expand: true,
          fields: { commonName: {}, sciName: {}, species: {} },
        })
        .map(({ ref }) => documentStore.getDoc(ref))
  })

  return queryFunc
}

export { useIndex }
