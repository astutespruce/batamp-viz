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
`

const Metric = styled.span`
  ${({ isActive }) =>
    isActive &&
    css`
      font-weight: bold;
      color: ${themeGet('colors.grey.800')};
    `}
`

const Contributor = ({
  contributor,
  detections,
  nights,
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
          <Metric isActive={metric === 'detections'}>
            {formatNumber(detections, 0)} detections
          </Metric>
          <br />
          on{' '}
          <Metric isActive={metric === 'nights'}>
            {formatNumber(nights, 0)} nights
          </Metric>
          <br />
          using{' '}
          <Metric isActive={metric === 'detectors'}>
            {detectors} detectors
          </Metric>
          <br />
          <Metric isActive={metric === 'species'}>{species} species</Metric>
          detected
        </Stats>
      </Column>
      <Column>
        <Donut
          size={100}
          percentSize={24}
          donutWidth={18}
          label={`of ${metric}`}
          percent={percent}
        />
      </Column>
    </Columns>
  </ContributorWrapper>
)

Contributor.propTypes = {
  contributor: PropTypes.string.isRequired,
  nights: PropTypes.number.isRequired,
  detections: PropTypes.number.isRequired,
  detectors: PropTypes.number.isRequired,
  species: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired,
  metric: PropTypes.string.isRequired,
}

export default Contributor
