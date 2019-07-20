import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { css } from 'styled-components'
import Img from 'gatsby-image'

import { Flex, Box } from 'components/Grid'
import { OutboundLink, Link } from 'components/Link'
import styled, { themeGet } from 'style'
import { formatNumber, quantityLabel } from 'util/format'
import {
  SPECIES
} from '../../../config/constants'

const Wrapper = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${themeGet('colors.grey.200')};
    padding-top: 0.5rem;
    margin-top: 1.5rem;
  }
`

const Header = styled(Box).attrs({ px: '1rem' })``

const Content = styled(Flex).attrs({ flexWrap: 'wrap', px: '1rem' })`
  line-height: 1.4;
`

const ThumbnailColumn = styled(Box).attrs({
  flex: ['1 0 auto', '0 1 auto', 0],
})`
  padding-right: 1rem;
`

const Thumbnail = styled(Box)`
  min-width: 210px;
`

const ImageCredits = styled.div`
  margin-top: 0.5rem;
  font-size: 0.6rem;
  color: ${themeGet('colors.grey.600')};
  line-height: 1.2;
`

const MapCredits = styled(ImageCredits)`
  margin: 0;
  font-size: 0.6rem;
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
  min-width: 200px;
  flex: 1;
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
      color: ${themeGet('colors.highlight.500')};
    `}
`

const Footnote = styled.div`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.700')};
`

const Map = styled.div`
  margin-left: 1rem;
`

const ListItem = ({
  item: {
    species,
    commonName,
    sciName,
    detectors,
    presenceOnlyDetectors,
    detections,
    presenceOnlyDetections,
    detectionNights,
    detectorNights,
    presenceOnlyDetectorNights,
    contributors,
  },
  metric,
  thumbnail,
  map,
}) => {

const {imageCredits } = SPECIES[species]

  return (
    <Wrapper>
      <Header>
        <Link to={`/species/${species}`}>
          <Name>
            {commonName} <ScientificName>({sciName})</ScientificName>
          </Name>
        </Link>
      </Header>

      <Content>
        <ThumbnailColumn>
          <Link to={`/species/${species}`}>
            <Thumbnail>
              <Img fluid={thumbnail} />
            </Thumbnail>
          </Link>
          <ImageCredits>
          credit:{' '}

            {imageCredits || (
              
          <>  
            <OutboundLink from="/species" to="https://www.merlintuttle.org">
              MerlinTuttle.org
            </OutboundLink>{' '}
            |{' '}
            <OutboundLink from="/species" to="http://www.batcon.org/">
              batcon.org
            </OutboundLink>
            
            </>
            )}
          </ImageCredits>
        </ThumbnailColumn>

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
            <Metric isActive={metric === 'contributors'}>{contributors}</Metric>{' '}
            {quantityLabel('contributors', contributors)}
          </li>

          {!!presenceOnlyDetectors && (
            <li>
              <Footnote>
                Note: {formatNumber(presenceOnlyDetections, 0)} detections on
                the {formatNumber(presenceOnlyDetectorNights, 0)} nights
                monitored at {formatNumber(presenceOnlyDetectors, 0)} detectors
                only recorded species presence, not activity.
              </Footnote>
            </li>
          )}
        </Stats>

        <Map>
          <Link to={`/species/${species}`}>
            <Img fixed={map} />
          </Link>
          <MapCredits>
            range:{' '}
            <OutboundLink from="/species" to="http://www.batcon.org/">
              batcon.org
            </OutboundLink>{' '}
            |{' '}
            <OutboundLink from="/species" to="http://www.iucnredlist.org/">
              IUCN
            </OutboundLink>
            <br />
            basemap: © Mapbox, © OpenStreetMap
          </MapCredits>
        </Map>
      </Content>
    </Wrapper>
  )
}

ListItem.propTypes = {
  item: PropTypes.shape({
    species: PropTypes.string.isRequired,
    commonName: PropTypes.string.isRequired,
    sciName: PropTypes.string.isRequired,
    detectors: PropTypes.number.isRequired,
    presenceOnlyDetectors: PropTypes.number,
    detections: PropTypes.number.isRequired,
    presenceOnlyDetections: PropTypes.number,
    detectionNights: PropTypes.number.isRequired,
    detectorNights: PropTypes.number.isRequired,
    presenceOnlyDetectorNights: PropTypes.number,
    contributors: PropTypes.number.isRequired,
  }).isRequired,
  metric: PropTypes.string.isRequired,
  thumbnail: PropTypes.object,
  map: PropTypes.object,
}

ListItem.defaultProps = {
  thumbnail: null,
  map: null,
}

// only rerender on item or metric change
export default memo(
  ListItem,
  (
    { item: { species: prevSpecies }, metric: prevMetric },
    { item: { species: nextSpecies }, metric: nextMetric }
  ) => prevSpecies === nextSpecies && prevMetric === nextMetric
)
