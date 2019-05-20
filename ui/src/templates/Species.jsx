import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from 'components/Layout'
import { Text } from 'components/Text'
import Map from 'components/Map'
import Sidebar from 'components/Sidebar'
import { Column, Columns, Flex } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'

const Wrapper = styled(Flex)`
  height: 100%;
`

const Header = styled.div`
  padding: 0.5rem 1rem;
  background-color: ${themeGet('colors.highlight.100')};
  line-height: 1.2;
`

const CommonName = styled(Text).attrs({ as: 'h1' })`
  margin: 0;
  font-weight: normal;
`

const ScientificName = styled(Text).attrs({ as: 'h3' })`
  margin: 0;
  font-weight: normal;
  font-style: italic;
  color: ${themeGet('colors.grey.700')};
`

const Stats = styled(Columns).attrs({ px: '1rem' })`
  border-top: 1px solid ${themeGet('colors.grey.400')};
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
  color: ${themeGet('colors.grey.800')};
  font-size: 0.8rem;
`

const RightColumn = styled(Column)`
  text-align: right;
`

const SpeciesTemplate = ({
  data: {
    speciesJson: {
      species,
      commonName,
      sciName,
      detections,
      nights,
      detectors,
      contributors,
    },
    detectorsJson: { detector, latitude, longitude },
  },
}) => {
  return (
    <Layout title={`${commonName} (${sciName})`}>
      <Wrapper>
        <Sidebar>
          <Header>
            <CommonName>{commonName}</CommonName>
            <ScientificName>{sciName}</ScientificName>
          </Header>

          <Stats>
            <Column>
              {formatNumber(detections, 0)} detections
              <br />
              {formatNumber(nights, 0)} nights
            </Column>
            <RightColumn>
              {detectors} detectors
              <br />
              {contributors ? (
                <>
                  {contributors.length}{' '}
                  {contributors.length === 1 ? 'contributor' : 'contributors'}
                </>
              ) : null}
            </RightColumn>
          </Stats>
        </Sidebar>
        <Map />
      </Wrapper>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {
  data: PropTypes.shape({
    speciesJson: PropTypes.shape({
      species: PropTypes.string.isRequired,
      commonName: PropTypes.string.isRequired,
      sciName: PropTypes.string.isRequired,
      detections: PropTypes.number.isRequired,
      nights: PropTypes.number.isRequired,
      detectors: PropTypes.number.isRequired,
      contributors: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    detectorsJson: PropTypes.shape({
      detector: PropTypes.number.isRequired,
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query SpeciesPageQuery($species: String!) {
    speciesJson(species: { eq: $species }) {
      species
      commonName
      sciName
      detections
      nights
      detectors
      contributors
    }
    detectorsJson(species_present: { eq: $species }) {
      site
      detector
      latitude
      longitude
    }
  }
`

export default SpeciesTemplate
