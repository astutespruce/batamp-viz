import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import { HeaderImage } from 'components/Image'
import Layout from 'components/Layout'
import { Container } from 'components/Grid'
import {
  TopSection,
  AboutSection,
  BatAMPSection,
  ContributorsSection,
  CreditsSection,
} from 'blocks/home'

const IndexPage = ({
  data: { headerImage: img, summaryJson, allContributorsJson },
}) => {
  const contributors = allContributorsJson.edges.map(({ node }) => node)

  return (
    <Layout title="Home">
      <HeaderImage
        image={img.childImageSharp.fluid}
        height="60vh"
        minHeight="34rem"
        position="bottom"
        credits={{
          author:
            'Silver-haired Bat (Lasionycteris noctivagans), José G. Martínez-Fonseca',
          url: 'https://www.instagram.com/svaldvard/?hl=en',
        }}
        title="Acoustic Monitoring"
        subtitle="is essential for helping study and conserve bats in North America."
      />

      <Container pb="3rem">
        <TopSection {...summaryJson} />

        <AboutSection />

        <BatAMPSection />

        <ContributorsSection contributors={contributors} totals={summaryJson} />

        <CreditsSection />
      </Container>
    </Layout>
  )
}

IndexPage.propTypes = {
  data: PropTypes.shape({
    headerImage: PropTypes.object.isRequired,
    summaryJson: PropTypes.shape({
      admin1: PropTypes.number.isRequired,
      detectorNights: PropTypes.number.isRequired,
      detectionNights: PropTypes.number.isRequired,
      allDetections: PropTypes.number.isRequired,
      sppDetections: PropTypes.number.isRequired,
      years: PropTypes.number.isRequired,
      contributors: PropTypes.number.isRequired,
    }),
    allContributorsJson: PropTypes.shape({
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            contributor: PropTypes.string.isRequired,
            allDetections: PropTypes.number.isRequired,
            sppDetections: PropTypes.number.isRequired,
            detectorNights: PropTypes.number.isRequired,
            species: PropTypes.number,
          }),
        })
      ).isRequired,
    }),
  }).isRequired,
}

export const pageQuery = graphql`
  query HomePageQuery {
    headerImage: file(relativePath: { eq: "NK1_6322.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 3200) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
    summaryJson {
      admin1
      contributors
      detectionNights
      detectorNights
      years
      allDetections
      sppDetections
      detectors
      species
    }
    allContributorsJson {
      edges {
        node {
          contributor
          allDetections
          sppDetections
          detectorNights
          detectors
          species
        }
      }
    }
  }
`

export default IndexPage
