import React, { memo, useState } from 'react'
import { Box, Flex, Grid, Heading, Paragraph } from 'theme-ui'
import * as aq from 'arquero'

import { ExpandableParagraph } from 'components/Text'
import { SortBar } from 'components/List'
import { summaryStats, METRIC_LABELS } from 'config'
import { formatNumber } from 'util/format'
import Contributor from './Contributor'

const metrics = ['sppDetections', 'detectorNights', 'detectors', 'species']

const sortOptions = metrics.map((m) => METRIC_LABELS[m] || m)

const Contributors = () => {
  const {
    species: totalSpp,
    sppDetections,
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

  const remainder = contributorsTable.slice(6).array('contributor')

  return (
    <Box sx={{ py: '3rem' }}>
      <Heading as="h2">Made possible by contributors like you</Heading>
      <Paragraph sx={{ color: 'grey.8' }}>
        This application leverages the combined efforts of <b>{contributors}</b>{' '}
        contributors and would not be possible without their hard work.
        Together, these contributors have collected over{' '}
        <b>{formatNumber(sppDetections, 0)}</b> detections of at least{' '}
        <b>{totalSpp}</b> species on <b>{formatNumber(detectorNights, 0)}</b>{' '}
        nights using <b>{formatNumber(detectors, 0)}</b> detectors.
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
          and {remainder.join(', ')}.
        </ExpandableParagraph>
      )}
    </Box>
  )
}

// Only render once
export default memo(Contributors, () => true)
