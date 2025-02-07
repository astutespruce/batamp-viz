import React, { memo, useState } from 'react'
import { Box, Flex, Grid, Heading, Paragraph } from 'theme-ui'
import * as aq from 'arquero'

import { ExpandableParagraph } from 'components/Text'
import { SortBar } from 'components/List'
import { summaryStats, METRICS } from 'config'
import { formatNumber } from 'util/format'
import Contributor from './Contributor'

const metrics = [
  'speciesDetections',
  'detectorNights',
  'detectors',
  'speciesDetected',
]

const sortOptions = metrics.map((m) => METRICS[m].label)

const Contributors = () => {
  const {
    speciesDetected,
    speciesDetections,
    detectors,
    detectorNights,
    contributors,
    contributorsTable: rawContributorsTable,
  } = summaryStats

  let contributorsTable = aq.table(rawContributorsTable)

  const [sortIdx, setSortIdx] = useState(0)

  const handleSortChange = (idx) => {
    setSortIdx(idx)
  }

  const metric = metrics[sortIdx]

  contributorsTable = contributorsTable.orderby(aq.desc(metric))

  const total = summaryStats[metric]

  const topN = contributorsTable
    .slice(0, 6)
    .derive({ percent: aq.escape((d) => (100 * d[metric]) / total) })
    .objects()

  // split contributors into a unique list of names after splitting out the first
  // contributor for each topN contributor (which may be multiple people)
  const contributorsArray = contributorsTable.array('contributors')
  const topContributors = new Set(
    contributorsArray.slice(0, 6).map((c) => c.split(',')[0])
  )
  const remainingContributors = new Set()
  contributorsArray.slice(6).forEach((c) => {
    c.split(',').forEach((indiv) => {
      if (!topContributors.has(indiv)) {
        remainingContributors.add(indiv)
      }
    })
  })
  const sortedRemainingContributors = [...remainingContributors].sort()

  return (
    <Box sx={{ py: '3rem' }}>
      <Heading as="h2">Made possible by contributors like you</Heading>
      <Paragraph sx={{ color: 'grey.8' }}>
        This application leverages the combined efforts of <b>{contributors}</b>{' '}
        contributors and would not be possible without their hard work.
        Together, these contributors have collected over{' '}
        <b>{formatNumber(speciesDetections, 0)}</b> detections of at least{' '}
        <b>{speciesDetected}</b> species on{' '}
        <b>{formatNumber(detectorNights, 0)}</b> nights using{' '}
        <b>{formatNumber(detectors, 0)}</b> detectors.
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
        {topN.map((row) => (
          <Contributor key={row.contributors} metric={metric} {...row} />
        ))}
      </Grid>
      {sortedRemainingContributors.length > 0 && (
        <ExpandableParagraph
          sx={{ mt: '1rem', '& p': { fontSize: 2 } }}
          snippet={`And ${sortedRemainingContributors.slice(0, 32).join(', ')}...`}
        >
          and {sortedRemainingContributors.join(', ')}.
        </ExpandableParagraph>
      )}
    </Box>
  )
}

// Only render once
export default memo(Contributors, () => true)
