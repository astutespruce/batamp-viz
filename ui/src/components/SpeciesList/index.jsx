import React, { useEffect, useReducer, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import { Set, List, Map } from 'immutable'
import ImmutablePropTypes from 'react-immutable-proptypes'

import { SearchField, useIndex } from 'components/Search'
import { Box, Flex, Columns, Column } from 'components/Grid'
import { SortBar, SearchBar } from 'components/List'
import styled, { themeGet } from 'style'
import ListItem from './ListItem'

const sortOptions = [
  {
    label: 'name',
    sortFunc: (a, b) => (a.get('commonName') > b.get('commonName') ? 1 : -1),
  },
  {
    label: 'scientific name',
    sortFunc: (a, b) => (a.get('sciName') > b.get('sciName') ? 1 : -1),
  },
  {
    label: 'detections',
    sortFunc: (a, b) => b.get('detections') - a.get('detections'),
  },
  { label: 'nights', sortFunc: (a, b) => b.get('nights') - a.get('nights') },
  {
    label: 'contributors',
    sortFunc: (a, b) => b.get('contributors').size - a.get('contributors').size,
  },
]

export const Wrapper = styled(Flex).attrs({
  flex: '1 1 auto',
  flexDirection: 'column',
})`
  border-right: 1px solid ${themeGet('colors.grey.200')};
  border-left: 1px solid ${themeGet('colors.grey.200')};
`

export const Count = styled.span`
  color: ${themeGet('colors.grey.600')};
  font-size: 0.8em;
  line-height: 1.2;
`

export const ListWrapper = styled.div`
  flex: 1 1 auto;
`

export const NoResults = styled(Box)`
  color: ${themeGet('colors.grey.600')};
  margin-top: 2rem;
  text-align: center;
`

const SpeciesList = ({ species }) => {
  const queryIndex = useIndex()

  const initialState = Map({
    species: species.sort(sortOptions[0].sortFunc),
    query: '',
    sortIdx: 0,
  })

  const speciesReducer = (state, { type, payload }) => {
    switch (type) {
      case 'query': {
        if (payload === state.get('query')) return state

        let newSpecies = species
        if (payload) {
          const filteredIDs = Set(
            queryIndex(payload).map(({ species: spp }) => spp)
          )
          newSpecies = species.filter(item =>
            filteredIDs.has(item.get('species'))
          )
        }

        return state.merge({
          query: payload,
          species: newSpecies.sort(sortOptions[state.get('sortIdx')].sortFunc),
        })
      }
      case 'sort': {
        if (payload === state.get('sortIdx')) return state

        return state.merge({
          sortIdx: payload,
          species: state.get('species').sort(sortOptions[payload].sortFunc),
        })
      }
      default: {
        throw new Error(`action type not handled: ${type}`)
      }
    }
  }

  const [state, dispatch] = useReducer(speciesReducer, initialState)

  const handleQueryChange = value => {
    dispatch({ type: 'query', payload: value })
  }

  const handleSortChange = idx => {
    dispatch({ type: 'sort', payload: idx })
  }

  const items = state.get('species', List())
  const metric = sortOptions[state.get('sortIdx')].label

  return (
    <Wrapper>
      <Columns px="1rem" alignItems="baseline">
        <Column>
          <Count>{items.size} species currently visible</Count>
        </Column>
        <Column>
          <SortBar
            index={state.get('sortIdx', 0)}
            options={sortOptions.map(({ label }) => label)}
            onChange={handleSortChange}
          />
        </Column>
      </Columns>

      <SearchBar
        value={state.get('query', '')}
        placeholder="Enter a species name"
        onChange={handleQueryChange}
      />

      {items.size > 0 ? (
        items.map(item => (
          <ListItem key={item.get('species')} item={item} metric={metric} />
        ))
      ) : (
        <NoResults>No visible species...</NoResults>
      )}
    </Wrapper>
  )
}

SpeciesList.propTypes = {
  species: ImmutablePropTypes.list.isRequired,
}

// only render once on construction
export default memo(SpeciesList, () => true)
