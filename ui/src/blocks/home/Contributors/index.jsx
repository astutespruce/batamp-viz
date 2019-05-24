import React, { memo, useState } from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import { SortBar } from 'components/List'
import styled from 'style'
import { formatNumber } from 'util/format'
import { Section, Title } from '../styles'
import Contributor from './Contributor'

const Subtitle = styled.h3`
  margin-bottom: 0.5rem;
`

const NameList = styled.p`
  margin-top: 1rem;
  font-size: 0.9em !important;
`

const metrics = ['detections', 'nights', 'detectors', 'species']

const Contributors = ({ contributors, totals }) => {
  const { species: totalSpp, detections, detectors, nights } = totals

  const [sortIdx, setSortIdx] = useState(0)

  const handleSortChange = idx => {
    setSortIdx(idx)
  }

  const metric = metrics[sortIdx]

  // Convert species array to species count
  const data = contributors.map(({ species, ...rest }) => ({
    species: species && species.length ? species.length : 0,
    ...rest,
  }))

  data.sort((a, b) => (a[metric] < b[metric] ? 1 : -1))

  const total = totals[metric]

  const topN = data
    .slice(0, 6)
    .map(d => ({ percent: (100 * d[metric]) / total, ...d }))

  const remainder = data
    .slice(6, data.length)
    .map(({ contributor }) => contributor)

  return (
    <Section>
      <Title>Made possible by contributors like you</Title>
      <p>
        This application leverages the combined efforts of {contributors.length}{' '}
        contributors and would not be possible without their hard work.
        Together, these contributors have collected over{' '}
        {formatNumber(detections, 0)} bat detections on{' '}
        {formatNumber(nights, 0)} nights using {formatNumber(detectors, 0)}{' '}
        detectors, and they have collected data for at least {totalSpp} species.
      </p>

      <Flex alignItems="center" justifyContent="space-between">
        <Subtitle>Top contributors</Subtitle>
        <SortBar
          index={sortIdx}
          options={metrics}
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
      nights: PropTypes.number.isRequired,
      detections: PropTypes.number.isRequired,
      detectors: PropTypes.number.isRequired,
      species: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  totals: PropTypes.shape({
    detections: PropTypes.number.isRequired,
    nights: PropTypes.number.isRequired,
    detectors: PropTypes.number.isRequired,
    species: PropTypes.number.isRequired,
  }).isRequired,
}

// Only render once
export default memo(Contributors, () => true)
