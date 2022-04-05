import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import { Text } from 'components/Text'
import Layout from 'components/Layout'
import { SubpageHeaderImage as HeaderImage } from 'components/Image'
import { Container } from 'components/Grid'
import { SpeciesList } from 'components/Species'
import { extractNodes } from 'util/data'
import styled from 'style'
import { SPECIES } from '../../config/constants'

const Title = styled(Text).attrs({
  fontSize: '3rem',
  as: 'h1',
  mb: '3rem',
})`
  line-height: 1.2;
`

const SpeciesPage = ({ data: { headerImage, allSpeciesJson } }) => {
  const species = extractNodes(allSpeciesJson).map((d) => ({
    ...d,
    ...SPECIES[d.species],
  }))

  return (
    <Layout title="Explore Bat Species">
      <HeaderImage
        image={headerImage}
        height="40vh"
        minHeight="20rem"
        position="bottom"
        credits={{
          author:
            'Fringed Myotis (Myotis thysanodes) by José G. Martínez-Fonseca',
        }}
      />
      <Container py="2rem">
        <Title>Explore Data for North American Bat Species</Title>
        <SpeciesList species={species} />
      </Container>
    </Layout>
  )
}

SpeciesPage.propTypes = {
  data: PropTypes.shape({
    headerImage: PropTypes.object.isRequired,
    allSpeciesJson: PropTypes.shape({
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            species: PropTypes.string.isRequired,
            detectors: PropTypes.number.isRequired,
            presenceOnlyDetectors: PropTypes.number,
            detections: PropTypes.number.isRequired,
            presenceOnlyDetections: PropTypes.number,
            detectionNights: PropTypes.number.isRequired,
            detectorNights: PropTypes.number.isRequired,
            presenceOnlyDetectorNights: PropTypes.number,
            contributors: PropTypes.number.isRequired,
          }).isRequired,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query {
    headerImage: file(relativePath: { eq: "NK1_6328.jpg" }) {
      childImageSharp {
        gatsbyImageData(
          layout: FULL_WIDTH
          formats: [AUTO, WEBP]
          placeholder: BLURRED
        )
      }
    }

    allSpeciesJson {
      edges {
        node {
          species
          detectors
          presenceOnlyDetectors: poDetectors
          detections
          presenceOnlyDetections: poDetections
          detectionNights
          detectorNights
          presenceOnlyDetectorNights: poDetectorNights
          contributors
        }
      }
    }
  }
`

export default SpeciesPage
