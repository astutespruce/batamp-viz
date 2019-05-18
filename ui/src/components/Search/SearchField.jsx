import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { Index } from 'elasticlunr'
import { FaSearch, FaRegTimesCircle } from 'react-icons/fa'

import styled, { themeGet } from 'style'
import { Link } from 'components/Link'
import { Box, Flex } from 'components/Grid'

const Wrapper = styled(Box)`
  position: relative;
`

const Container = styled(Flex).attrs({ alignItems: 'center' })`
  background: #fff;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
`

const Icon = styled(FaSearch)`
  color: ${themeGet('colors.grey.400')};
  width: 1rem;
  height: 1rem;
  margin-right: 0.5em;
`

const ResetIcon = styled(FaRegTimesCircle)`
  width: 1rem;
  height: 1rem;
  margin-left: 0.5em;
  visibility: ${({ visible }) => visible};
  cursor: pointer;

  color: ${themeGet('colors.grey.400')};
  transition: color 0.25s linear;
  &:hover {
    color: ${themeGet('colors.grey.600')};
  }
`

const Input = styled.input.attrs({
  type: 'text',
})`
  padding: 0;
  outline: none;
  border: none;
`
const Results = styled.ul`
  list-style: none;
  position: absolute;
  z-index: 20000;
  right: 0;
  background: #fff;
  margin: 4px 0 0 0;
  box-shadow: 2px 2px 6px ${themeGet('colors.grey.800')};
  overflow-y: auto;
  max-height: 50vh;
  width: 250px;
  border-radius: 0.25rem;
  border-bottom: 4px solid #fff;
`

const ResultLink = styled(Link)`
  padding: 0.5em 1em;
  display: block;
`

const Result = styled.li`
  padding: 0;
  margin: 0;
  line-height: 1.2;
  &:hover {
    background-color: ${themeGet('colors.grey.100')};
  }
  &:not(:first-child) {
    border-top: 1px solid ${themeGet('colors.grey.200')};
  }
`

const ScientificName = styled.span`
  font-size: 0.8em;
  color: ${themeGet('colors.grey.600')};
`

const NoResult = styled.li`
  padding: 0.25em 1em;
  margin: 0;
  color: ${themeGet('colors.grey.400')};
  text-align: center;
  font-size: 0.8em;
`

const SearchField = ({ rawIndex }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const indexRef = useRef(null)

  useEffect(() => {
    indexRef.current = Index.load(rawIndex)
  }, [rawIndex])

  const handleChange = ({ target: { value } }) => {
    const { current: index } = indexRef
    setQuery(value)

    // only search against title field
    setResults(
      index
        .search(value, {
          expand: true,
          fields: { commonName: {}, sciName: {}, species: {} },
        })
        .map(({ ref }) => index.documentStore.getDoc(ref))
    )
  }

  const handleReset = () => setQuery('')

  return (
    <Wrapper ml={['0.25rem', '1rem']} mr={['0.25rem', '0.5rem', '1rem']}>
      <Container
        p={['0.1em 0.25em', '0.25em 0.5em']}
        fontSize={['0.75rem', '0.8rem']}
      >
        <Icon />
        <Input placeholder="Search..." value={query} onChange={handleChange} />
        <ResetIcon
          visible={query ? 'visible' : 'hidden'}
          onClick={handleReset}
        />
      </Container>
      {query && (
        <Results>
          {results && results.length > 0 ? (
            results.map(({ id, path, commonName, sciName }) => (
              <Result key={id}>
                <ResultLink to={path}>
                  {commonName}
                  <br />
                  <ScientificName>({sciName})</ScientificName>
                </ResultLink>
              </Result>
            ))
          ) : (
            <NoResult>No pages match your query...</NoResult>
          )}
        </Results>
      )}
    </Wrapper>
  )
}

SearchField.propTypes = {
  rawIndex: PropTypes.object.isRequired,
}

export default SearchField
