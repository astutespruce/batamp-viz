import React, { memo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Grid, Heading, Paragraph } from 'theme-ui'

import { ExpandableParagraph } from 'components/Text'
import { SortBar } from 'components/List'
import { formatNumber } from 'util/format'
import Contributor from './Contributor'
import { METRIC_LABELS } from '../../../../config/constants'

const metrics = [
  'sppDetections',
  'allDetections',
  'detectorNights',
  'detectors',
  'species',
]

const sortOptions = metrics.map((m) => METRIC_LABELS[m] || m)

const Contributors = ({ contributors, totals }) => {
  const {
    species: totalSpp,
    allDetections,
    sppDetections,
    detectors,
    detectorNights,
  } = totals

  const [sortIdx, setSortIdx] = useState(0)

  const handleSortChange = (idx) => {
    setSortIdx(idx)
  }

  const metric = metrics[sortIdx]

  contributors.sort((a, b) => (a[metric] < b[metric] ? 1 : -1))

  const total = totals[metric]

  const topN = contributors
    .slice(0, 6)
    .map((d) => ({ percent: (100 * d[metric]) / total, ...d }))

  const remainder = contributors
    .slice(6, contributors.length)
    .map(({ contributor }) => contributor)

  return (
    <Box sx={{ py: '3rem' }}>
      <Heading as="h2">Made possible by contributors like you</Heading>
      <Paragraph sx={{ color: 'grey.8' }}>
        This application leverages the combined efforts of{' '}
        <b>{contributors.length}</b> contributors and would not be possible
        without their hard work. Together, these contributors have collected
        over <b>{formatNumber(allDetections, 0)}</b> bat detections on{' '}
        <b>{formatNumber(detectorNights, 0)}</b> nights using{' '}
        <b>{formatNumber(detectors, 0)}</b> detectors, and they have collected{' '}
        <b>{formatNumber(sppDetections, 0)}</b> detections of at least{' '}
        <b>{totalSpp}</b> species.
      </Paragraph>

      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: '2rem',
        }}
      >
        <Heading as="h3">Top contributors</Heading>
        <SortBar
          index={sortIdx}
          options={sortOptions}
          onChange={handleSortChange}
        />
      </Flex>

      <Grid columns={[2, 3]} gap={3} sx={{ mt: '0.5rem' }}>
        {topN.map((contributor) => (
          <Contributor
            key={contributor.contributor}
            metric={metric}
            {...contributor}
          />
        ))}
      </Grid>
      {remainder.length > 0 && (
        <ExpandableParagraph
          sx={{ mt: '1rem', '& p': { fontSize: 2 } }}
          snippet={`And ${remainder.slice(0, 32).join(', ')}...`}
        >
          And {remainder.join(', ')}.
        </ExpandableParagraph>
      )}
    </Box>
  )
}

Contributors.propTypes = {
  contributors: PropTypes.arrayOf(
    PropTypes.shape({
      contributor: PropTypes.string.isRequired,
      detectorNights: PropTypes.number.isRequired,
      allDetections: PropTypes.number.isRequired,
      sppDetections: PropTypes.number.isRequired,
      detectors: PropTypes.number.isRequired,
      species: PropTypes.number,
    })
  ).isRequired,
  totals: PropTypes.shape({
    allDetections: PropTypes.number.isRequired,
    sppDetections: PropTypes.number.isRequired,
    detectorNights: PropTypes.number.isRequired,
    detectors: PropTypes.number.isRequired,
    species: PropTypes.number.isRequired,
  }).isRequired,
}

// Only render once
export default memo(Contributors, () => true)
