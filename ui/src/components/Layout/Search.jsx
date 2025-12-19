import React, { useState, useMemo } from 'react'
import { Box, Text } from 'theme-ui'

import { Link } from 'components/Link'
import { SearchField } from 'components/Search'
import { SPECIES } from 'config'

const Search = () => {
  const index = useMemo(
    () =>
      Object.entries(SPECIES).map(([id, { sciName, commonName }]) => ({
        id,
        sciName,
        commonName,
        path: `/species/${id}`,
        searchKey: `${id} ${commonName.toLowerCase()} ${sciName.toLowerCase()}`,
      })),
    []
  )

  const [query, setQuery] = useState('')

  const handleChange = (value) => {
    setQuery(value)
  }

  const results =
    query && query.length >= 3
      ? index.filter(
          ({ searchKey }) => searchKey.search(query.toLowerCase()) !== -1
        )
      : []

  return (
    <Box
      sx={{
        display: ['none', 'none', 'none', 'unset'],
        width: ['200px', 'auto'],
        position: 'relative',
        zIndex: 10000,
      }}
    >
      <SearchField value={query} onChange={handleChange} />
      {query ? (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 20000,
            right: 0,
            background: '#fff',
            margin: '4px 0 0 0',
            boxShadow: '2px 2px 6px #004274',
            overflowY: 'auto',
            maxHeight: '50vh',
            width: '300px',
            borderRadius: '0.25rem',
            borderBottom: '4px solid #fff',
          }}
        >
          {query && query.length < 3 ? (
            <Text
              sx={{
                padding: '0.25em 1em',
                margin: 0,
                color: 'grey.4',
                textAlign: 'center',
                fontSize: '0.8em',
              }}
            >
              keep typing...
            </Text>
          ) : null}

          {results && results.length > 0
            ? results.map(({ id, path, commonName, sciName }) => (
                <Link
                  key={id}
                  to={path}
                  sx={{
                    display: 'block',
                    p: '0.25em 1em',
                    m: '0',
                    lineHeight: 1.3,
                    '&:not(:first-of-type)': {
                      borderTop: '1px solid',
                      borderTopColor: 'grey.2',
                    },
                    '&:hover': {
                      bg: 'grey.1',
                    },
                  }}
                >
                  <Text sx={{ color: 'link', fontSize: '1.1rem' }}>
                    {commonName}
                  </Text>
                  <Text sx={{ fontSize: '0.9rem', color: 'grey.6' }}>
                    ({sciName})
                  </Text>
                </Link>
              ))
            : null}

          {query && query.length >= 3 && results.length === 0 ? (
            <Text
              sx={{
                padding: '0.25em 1em',
                margin: 0,
                color: 'grey.4',
                textAlign: 'center',
                fontSize: '0.8em',
              }}
            >
              No species match your query...
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}

export default Search
