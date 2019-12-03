import React from 'react'
import PropTypes from 'prop-types'
import { css } from 'styled-components'

import { Box, Columns, Column } from 'components/Grid'
import { Donut } from 'components/Chart'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'

const ContributorWrapper = styled(Box).attrs({
  p: '1rem',
  m: '0.5rem',
  flex: '0 0 auto',
})`
  border-radius: 0.25rem;
  background-color: ${themeGet('colors.grey.100')};
  width: 310px;
`

const Name = styled.div`
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
  margin-bottom: 0.5rem;
`

const Stats = styled.div`
  color: ${themeGet('colors.grey.600')};
  font-size: 0.8rem;
  line-height: 1.4;
`

const Metric = styled.span`
  ${({ isActive }) =>
    isActive &&
    css`
      font-weight: bold;
      color: ${themeGet('colors.grey.800')};
    `}
`

const donutLabels = {
  sppDetections: 'detections',
  allDetections: 'detections',
  detectorNights: 'nights',
}

const Contributor = ({
  contributor,
  allDetections,
  sppDetections,
  detectorNights,
  detectors,
  species,
  percent,
  metric,
}) => (
  <ContributorWrapper>
    <Name>{contributor}</Name>

    <Columns justifyContent="space-between">
      <Column>
        <Stats>
          <Metric
            isActive={metric === 'allDetections' || metric === 'sppDetections'}
          >
            {formatNumber(
              metric === 'allDetections' ? allDetections : sppDetections,
              0
            )}{' '}
            detections
          </Metric>
          <br />
          on{' '}
          <Metric isActive={metric === 'detectorNights'}>
            {formatNumber(detectorNights, 0)} nights
          </Metric>
          <br />
          using{' '}
          <Metric isActive={metric === 'detectors'}>
            {detectors} detectors
          </Metric>
          .
          <br />
          <br />
          <Metric isActive={metric === 'species'}>
            {species} species
          </Metric>{' '}
          detected.
        </Stats>
      </Column>
      <Column flex="0 0 auto">
        <Donut
          size={100}
          percentSize={24}
          donutWidth={18}
          label={`of ${donutLabels[metric] || metric}`}
          percent={percent}
        />
      </Column>
    </Columns>
  </ContributorWrapper>
)

Contributor.propTypes = {
  contributor: PropTypes.string.isRequired,
  detectorNights: PropTypes.number.isRequired,
  allDetections: PropTypes.number.isRequired,
  sppDetections: PropTypes.number.isRequired,
  detectors: PropTypes.number.isRequired,
  species: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired,
  metric: PropTypes.string.isRequired,
}

export default Contributor
