import React, { memo } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { css } from 'styled-components'

import { Columns, Column } from 'components/Grid'
import { Link } from 'components/Link'
import styled, { themeGet, theme } from 'style'
import { formatNumber, quantityLabel } from 'util/format'

const Wrapper = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${themeGet('colors.grey.100')};
  }
`

const Content = styled.div`
  line-height: 1.4;
  padding: 1rem;
  color: ${themeGet('colors.grey.600')};

  &:hover {
    background-color: ${theme.colors.primary[100]}50;
  }
`

const Name = styled.div`
  color: ${themeGet('colors.link')};
  font-size: 1.25rem;
`

const ScientificName = styled.div`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.600')};
`

const Stats = styled.div`
  font-size: 0.8rem;
  text-align: right;
`

const Metric = styled.span`
  ${({ isActive }) =>
    isActive &&
    css`
      font-weight: bold;
      color: ${themeGet('colors.grey.800')};
    `}
`

const ListItem = ({ item, metric }) => {
  const {
    species,
    commonName,
    sciName,
    detectors,
    detections,
    detectionNights,
    detectorNights,
    contributors,
  } = item.toJS()

  return (
    <Wrapper>
      <Link to={`/species/${species}`}>
        <Content>
          <Columns>
            <Column>
              <Name>{commonName}</Name>
              <ScientificName>({sciName})</ScientificName>
            </Column>
            <Column>
              <Stats>
                {detections > 0 ? (
                  <>
                    <Metric isActive={metric === 'detections'}>
                      {formatNumber(detections, 0)} detections
                    </Metric>{' '}
                    on{' '}
                    <Metric isActive={metric === 'nights detected'}>
                      {formatNumber(detectionNights, 0)} nights
                    </Metric>
                  </>
                ) : (
                  <Metric>not detected on any night</Metric>
                )}
                <br />
                monitored at{' '}
                <Metric isActive={metric === 'detectors'}>
                  {formatNumber(detectors, 0)} detectors
                </Metric>{' '}
                for {formatNumber(detectorNights, 0)} nights
                {contributors ? (
                  <>
                    <br />
                    by{' '}
                    <Metric isActive={metric === 'contributors'}>
                      {contributors}{' '}
                      {quantityLabel('contributors', contributors)}
                    </Metric>
                  </>
                ) : null}
              </Stats>
            </Column>
          </Columns>
        </Content>
      </Link>
    </Wrapper>
  )
}

ListItem.propTypes = {
  item: ImmutablePropTypes.mapContains({
    species: PropTypes.string.isRequired,
    commonName: PropTypes.string.isRequired,
    sciName: PropTypes.string.isRequired,
    detectors: PropTypes.number.isRequired,
    detections: PropTypes.number.isRequired,
    detectionNights: PropTypes.number.isRequired,
    detectorNights: PropTypes.number.isRequired,
    contributors: PropTypes.number.isRequired,
  }).isRequired,
  metric: PropTypes.string.isRequired,
}

// only rerender on item or metric change
export default memo(
  ListItem,
  (
    { item: prevItem, metric: prevMetric },
    { item: nextItem, metric: nextMetric }
  ) => prevItem.equals(nextItem) && prevMetric === nextMetric
)
