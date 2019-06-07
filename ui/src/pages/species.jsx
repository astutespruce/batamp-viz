import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { fromJS } from 'immutable'

import Layout from 'components/Layout'
import { Container } from 'components/Grid'
import SpeciesList from 'components/SpeciesList'
import styled from 'style'

const Title = styled.h1`
  text-align: center;
`

const SpeciesPage = ({
  data: {
    allSpeciesJson: { edges },
  },
}) => {
  const species = fromJS(edges.map(({ node }) => node))

  return (
    <Layout title="Explore Bat Species">
      <Container py="2rem">
        <Title>Explore Bat Species</Title>
        <SpeciesList species={species} />
      </Container>
    </Layout>
  )
}

SpeciesPage.propTypes = {
  data: PropTypes.shape({
    allSpeciesJson: PropTypes.shape({
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            species: PropTypes.string.isRequired,
            commonName: PropTypes.string.isRequired,
            sciName: PropTypes.string.isRequired,
            detections: PropTypes.number.isRequired,
            nights: PropTypes.number.isRequired,
            contributors: PropTypes.arrayOf(PropTypes.string).isRequired,
          }).isRequired,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query {
    allSpeciesJson {
      edges {
        node {
          species
          commonName
          sciName
          detections
          nights: detectionNights
          contributors
        }
      }
    }
  }
`

export default SpeciesPage
