import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Img from 'gatsby-image'
import PropTypes from 'prop-types'

import { Credits } from 'components/Image'
import { Box, Columns, Column, Flex } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { Section, Title } from './styles'

const ContributorWrapper = styled(Box).attrs({
  p: '1rem',
  m: '0.5rem',
  flex: '1 0 auto',
})`
  border-radius: 0.25rem;
  background-color: ${themeGet('colors.grey.100')};
  width: 200px;
`

const Name = styled.div`
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
  margin-bottom: 0.5rem;
`

const Stats = styled.div`
  color: ${themeGet('colors.grey.600')};
  font-size: 0.8rem;
`

const ContributorPropType = PropTypes.shape({
  contributor: PropTypes.string.isRequired,
  nights: PropTypes.number.isRequired,
  detections: PropTypes.number.isRequired,
  detectors: PropTypes.number.isRequired,
  species: PropTypes.arrayOf(PropTypes.string),
})

const Contributor = ({
  contributor,
  detections,
  nights,
  detectors,
  species,
}) => (
  <ContributorWrapper>
    <Name>{contributor}</Name>

    <Stats>
      {formatNumber(detections, 0)} detections
      <br />
      on {formatNumber(nights, 0)} nights
      <br />
      using {detectors} detectors
      <br />
      {species.length} species detected
    </Stats>
  </ContributorWrapper>
)

Contributor.propTypes = ContributorPropType.isRequired

const Contributors = ({ contributors }) => {
  return (
    <Section>
      <Title>Made possible by contributors like you</Title>
      <p>
        This application leverages the combined efforts of {contributors.length}{' '}
        contributors and would not be possible without their hard work.
      </p>
      <h3>Current contributors</h3>
      <Flex flexWrap="wrap">
        {contributors.map(contributor => (
          <Contributor key={contributor.contributor} {...contributor} />
        ))}
      </Flex>
    </Section>
  )
}

Contributors.propTypes = {
  contributors: PropTypes.arrayOf(ContributorPropType).isRequired,
}

export default Contributors
