import React, { memo } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { css } from 'styled-components'
import Img from 'gatsby-image'

import { Flex, Box } from 'components/Grid'
import { OutboundLink, Link } from 'components/Link'
import styled, { themeGet } from 'style'
import { formatNumber, quantityLabel } from 'util/format'

const Wrapper = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${themeGet('colors.grey.200')};
    padding-top: 0.5rem;
    margin-top: 0.5rem;
  }
`

const Content = styled(Flex).attrs({ flexWrap: 'wrap' })`
  line-height: 1.4;
  padding: 1rem;
`

const ThumbnailColumn = styled(Box).attrs({
  flex: ['1 0 auto', '0 1 auto', 0],
})`
  padding-right: 1rem;
`

const Profile = styled.div`
  min-width: 200px;
  flex: 1;
`

const Thumbnail = styled(Box)`
  min-width: 210px;
`

const ImageCredits = styled.div`
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: ${themeGet('colors.grey.600')};
  line-height: 1;
`

const Name = styled.div`
  color: ${themeGet('colors.link')};
  font-size: 1.75rem;
`

const ScientificName = styled.span`
  font-size: 1rem;
  color: ${themeGet('colors.grey.700')};
`

const Stats = styled.ul`
  margin: 1rem 0 0 0;
  list-style: none;
  color: ${themeGet('colors.grey.800')};

  li {
    margin-bottom: 0.5rem;
  }
`

const Metric = styled.span`
  ${({ isActive }) =>
    isActive &&
    css`
      font-weight: bold;
      color: ${themeGet('colors.grey.800')};
    `}
`

const ListItem = ({ item, metric, thumbnail }) => {
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
      <Content>
        <ThumbnailColumn>
          <Link to={`/species/${species}`}>
            <Thumbnail>
              <Img fluid={thumbnail} />
            </Thumbnail>
          </Link>
          <ImageCredits>
            credit:{' '}
            <OutboundLink from="/species" to="https://www.merlintuttle.org">
              MerlinTuttle.org
            </OutboundLink>{' '}
            |{' '}
            <OutboundLink from="/species" to="http://www.batcon.org/">
              BCI
            </OutboundLink>
          </ImageCredits>
        </ThumbnailColumn>

        <Profile>
          <Link to={`/species/${species}`}>
            <Name>
              {commonName} <ScientificName>({sciName})</ScientificName>
            </Name>
          </Link>

          <Stats>
            {detections > 0 ? (
              <li>
                <Metric isActive={metric === 'detections'}>
                  {formatNumber(detections, 0)}
                </Metric>{' '}
                detections
              </li>
            ) : null}

            <li>
              {detectionNights > 0 ? (
                <>
                  on{' '}
                  <Metric isActive={metric === 'nights detected'}>
                    {formatNumber(detectionNights, 0)}
                  </Metric>{' '}
                </>
              ) : (
                'not detected on any '
              )}
              of {formatNumber(detectorNights, 0)} nights monitored
            </li>

            <li>
              <Metric isActive={metric === 'detectors'}>
                {formatNumber(detectors, 0)}
              </Metric>{' '}
              detectors monitored by{' '}
              <Metric isActive={metric === 'contributors'}>
                {contributors}
              </Metric>{' '}
              {quantityLabel('contributors', contributors)}
            </li>
          </Stats>
        </Profile>
      </Content>
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
  thumbnail: PropTypes.object,
}

ListItem.defaultProps = {
  thumbnail: null,
}

// only rerender on item or metric change
export default memo(
  ListItem,
  (
    { item: prevItem, metric: prevMetric },
    { item: nextItem, metric: nextMetric }
  ) => prevItem.equals(nextItem) && prevMetric === nextMetric
)
