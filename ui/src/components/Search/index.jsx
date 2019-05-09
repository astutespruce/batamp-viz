import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

import SearchField from './SearchField'

const Search = () => {
  const data = useStaticQuery(graphql`
    query SearchIndexQuery {
      siteSearchIndex {
        index
      }
    }
  `)

  return <SearchField rawIndex={data.siteSearchIndex.index} />
}

export default Search
