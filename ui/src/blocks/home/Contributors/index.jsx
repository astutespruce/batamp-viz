import React, { memo, useState } from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import { SortBar } from 'components/List'
import styled from 'style'
import { formatNumber } from 'util/format'
import { Section, Title } from '../styles'
import Contributor from './Contributor'
import { METRIC_LABELS } from '../../../../config/constants'

const Subtitle = styled.h3`
  margin-bottom: 0.5rem;
`

const NameList = styled.p`
  margin-top: 1rem;
  font-size: 0.9em !important;
`

const metrics = [
  'sppDetections',
  'allDetections',
  'detectorNights',
  'detectors',
  'species',
]

const sortOptions = metrics.map(m => METRIC_LABELS[m] || m)

const Contributors = ({ contributors, totals }) => {
  const {
    species: totalSpp,
    allDetections,
    sppDetections,
    detectors,
    detectorNights,
  } = totals

  const [sortIdx, setSortIdx] = useState(0)

  const handleSortChange = idx => {
    setSortIdx(idx)
  }

  const metric = metrics[sortIdx]

  contributors.sort((a, b) => (a[metric] < b[metric] ? 1 : -1))

  const total = totals[metric]

  const topN = contributors
    .slice(0, 6)
    .map(d => ({ percent: (100 * d[metric]) / total, ...d }))

  const remainder = contributors
    .slice(6, contributors.length)
    .map(({ contributor }) => contributor)

  return (
    <Section>
      <Title>Made possible by contributors like you</Title>
      <p>
        This application leverages the combined efforts of{' '}
        <b>{contributors.length}</b> contributors and would not be possible
        without their hard work. Together, these contributors have collected
        over <b>{formatNumber(allDetections, 0)}</b> bat detections on{' '}
        <b>{formatNumber(detectorNights, 0)}</b> nights using{' '}
        <b>{formatNumber(detectors, 0)}</b> detectors, and they have collected{' '}
        <b>{formatNumber(sppDetections, 0)}</b> detections of at least{' '}
        <b>{totalSpp}</b> species.
      </p>

      <Flex alignItems="center" justifyContent="space-between">
        <Subtitle>Top contributors</Subtitle>
        <SortBar
          index={sortIdx}
          options={sortOptions}
          onChange={handleSortChange}
        />
      </Flex>

      <Flex flexWrap="wrap">
        {topN.map(contributor => (
          <Contributor
            key={contributor.contributor}
            metric={metric}
            {...contributor}
          />
        ))}
      </Flex>
      {remainder.length > 0 && <NameList>And {remainder.join(', ')}.</NameList>}
    </Section>
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
