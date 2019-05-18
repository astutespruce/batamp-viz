import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { fromJS } from 'immutable'

import Layout from 'components/Layout'
import { Container, Flex } from 'components/Grid'
import SpeciesList from 'components/SpeciesList'
import styled from 'style'

const Title = styled.h1`
  text-align: center;
`

const SpeciesPage = ({
  data: {
    allSpeciesJson: { edges },
    siteSearchIndex: { index },
  },
}) => {
  const species = fromJS(edges.map(({ node }) => node))

  return (
    <Layout title="Explore Bat Species">
      <Container py="2rem">
        <Title>Explore Bat Species</Title>
        <SpeciesList species={species} index={index} />
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
          }).isRequired,
        })
      ).isRequired,
    }).isRequired,
    siteSearchIndex: PropTypes.shape({
      index: PropTypes.object.isRequired,
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
          nights
        }
      }
    }
    siteSearchIndex {
      index
    }
  }
`

export default SpeciesPage
