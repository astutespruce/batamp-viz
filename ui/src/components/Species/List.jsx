import React, { useReducer, memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Flex } from 'theme-ui'

import { useIndex } from 'components/Search'
import { SortBar, SearchBar } from 'components/List'
import { useThumbnails as useMapThumbnails } from 'components/Species/MapThumbnail'
import { useThumbnails } from 'components/Species/Thumbnail'
import ListItem from './ListItem'

const sortOptions = [
  {
    label: 'name',
    sortFunc: (a, b) => (a.commonName > b.commonName ? 1 : -1),
  },
  {
    label: 'scientific name',
    sortFunc: (a, b) => (a.sciName > b.sciName ? 1 : -1),
  },
  {
    label: 'detections',
    sortFunc: (a, b) => b.detections - a.detections,
  },
  {
    label: 'nights detected',
    sortFunc: (a, b) => b.detectionNights - a.detectionNights,
  },
  {
    label: 'detectors',
    sortFunc: (a, b) => b.detectors - a.detectors,
  },
  {
    label: 'contributors',
    sortFunc: (a, b) => b.contributors - a.contributors,
  },
]

const SpeciesList = ({ species }) => {
  const queryIndex = useIndex()

  const initialState = {
    species: species.sort(sortOptions[0].sortFunc),
    query: '',
    sortIdx: 0,
  }

  const speciesReducer = (state, { type, payload }) => {
    switch (type) {
      case 'query': {
        if (payload === state.query) return state

        let newSpecies = species
        if (payload) {
          const filteredIDs = new Set(
            queryIndex(payload).map(({ species: spp }) => spp)
          )
          newSpecies = species.filter(({ species: spp }) =>
            filteredIDs.has(spp)
          )
        }

        return {
          ...state,
          query: payload,
          species: newSpecies.sort(sortOptions[state.sortIdx].sortFunc),
        }
      }
      case 'sort': {
        if (payload === state.sortIdx) return state

        return {
          ...state,
          sortIdx: payload,
          species: state.species.sort(sortOptions[payload].sortFunc),
        }
      }
      default: {
        throw new Error(`action type not handled: ${type}`)
      }
    }
  }

  const [state, dispatch] = useReducer(speciesReducer, initialState)

  const handleQueryChange = (value) => {
    dispatch({ type: 'query', payload: value })
  }

  const handleSortChange = (idx) => {
    dispatch({ type: 'sort', payload: idx })
  }

  const items = state.species || []
  const metric = sortOptions[state.sortIdx].label

  const thumbnails = useThumbnails()
  const maps = useMapThumbnails()

  return (
    <Box>
      <Flex
        sx={{
          flex: '0 0 auto',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          px: '1rem',
        }}
      >
        <Box sx={{ color: 'grey.7', lineHeight: 1.2 }}>
          {items.length} species currently visible
        </Box>
        <Box>
          <SortBar
            index={state.sortIdx || 0}
            options={sortOptions.map(({ label }) => label)}
            onChange={handleSortChange}
          />
        </Box>
      </Flex>

      <Box sx={{ my: '0.5rem' }}>
        <SearchBar
          value={state.query || ''}
          placeholder="Enter a species name"
          onChange={handleQueryChange}
        />
      </Box>

      <Box>
        {items.length > 0 ? (
          items.map((item) => (
            <ListItem
              key={item.species}
              item={item}
              metric={metric}
              thumbnail={thumbnails[item.species] || null}
              map={maps[item.species] || null}
            />
          ))
        ) : (
          <Box sx={{ color: 'grey.6', mt: '2rem', textAlign: 'center' }}>
            No visible species...
          </Box>
        )}
      </Box>
    </Box>
  )
}

SpeciesList.propTypes = {
  species: PropTypes.arrayOf(
    PropTypes.shape({
      species: PropTypes.string.isRequired,
      detections: PropTypes.number.isRequired,
      detectionNights: PropTypes.number.isRequired,
      contributors: PropTypes.number.isRequired,
      commonName: PropTypes.string.isRequired,
      sciName: PropTypes.string.isRequired,
    })
  ).isRequired,
}

// only render once on construction
export default memo(SpeciesList, () => true)
