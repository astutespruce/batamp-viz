import React, { useState, memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex } from 'theme-ui'
import * as aq from 'arquero'

import { SortBar, SearchBar } from 'components/List'
import { useThumbnails as useMapThumbnails } from 'components/Species/MapThumbnail'
import { useThumbnails } from 'components/Species/Thumbnail'
import ListItem from './ListItem'

const sortOptions = [
  {
    key: 'commonName',
    label: 'name',
  },
  {
    key: 'sciName',
    label: 'scientific name',
  },
  {
    key: 'detections',
    label: 'detections',
  },
  {
    key: 'detectionNights',
    label: 'nights detected',
  },
  {
    key: 'detectors',
    label: 'detectors',
  },
  {
    key: 'contributors',
    label: 'contributors',
  },
]

const SpeciesList = ({ speciesTable }) => {
  const [{ query, sortIdx }, setState] = useState(() => ({
    query: '',
    sortIdx: 0,
  }))

  const handleQueryChange = (value) => {
    setState((prevState) => ({ ...prevState, query: value }))
  }

  const handleSortChange = (idx) => {
    setState((prevState) => ({ ...prevState, sortIdx: idx }))
  }

  const { key: sortKey, label: metric } = sortOptions[sortIdx]
  const items = (
    query
      ? speciesTable.filter(
          aq.escape((d) => d.searchKey.search(query.toLowerCase()) !== -1)
        )
      : speciesTable
  )
    // sort name fields ascending, rest descending
    .orderby(metric.search('name') !== -1 ? sortKey : aq.desc(sortKey))
    .objects()

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
            index={sortIdx}
            options={sortOptions.map(({ label }) => label)}
            onChange={handleSortChange}
          />
        </Box>
      </Flex>

      <Box sx={{ my: '0.5rem' }}>
        <SearchBar
          value={query}
          placeholder="Enter a species name"
          onChange={handleQueryChange}
        />
      </Box>

      <Box>
        {items.length > 0 ? (
          items.map((item) => (
            <ListItem
              key={item.speciesID}
              item={item}
              metric={metric}
              thumbnail={thumbnails[item.speciesID] || null}
              map={maps[item.speciesID] || null}
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
  speciesTable: PropTypes.object.isRequired,
}

// only render once on construction
export default memo(SpeciesList, () => true)
