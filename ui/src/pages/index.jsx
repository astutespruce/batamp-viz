import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { Container } from 'theme-ui'

import { HeaderImage } from 'components/Image'
import { Layout, SEO } from 'components/Layout'
import { TopSection, ContributorsSection, CreditsSection } from 'blocks/home'

const IndexPage = ({
  data: { headerImage: img, summaryJson, allContributorsJson },
}) => {
  const contributors = allContributorsJson.edges.map(({ node }) => node)

  return (
    <Layout>
      <HeaderImage
        image={img}
        height="60vh"
        minHeight="39rem"
        position="bottom"
        credits={{
          author:
            'Silver-haired Bat (Lasionycteris noctivagans), José G. Martínez-Fonseca',
          url: 'https://www.instagram.com/svaldvard/?hl=en',
        }}
        title="Acoustic Monitoring"
        subtitle="is essential for helping study and conserve bats in North America."
      />

      <Container>
        <TopSection {...summaryJson} />

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
      sppDetections: PropTypes.number.isRequired,
      years: PropTypes.number.isRequired,
      contributors: PropTypes.number.isRequired,
    }),
    allContributorsJson: PropTypes.shape({
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            contributor: PropTypes.string.isRequired,
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
        gatsbyImageData(
          layout: FULL_WIDTH
          formats: [AUTO]
          placeholder: BLURRED
        )
      }
    }
    summaryJson {
      admin1
      contributors
      detectionNights
      detectorNights
      years
      sppDetections
      detectors
      species
    }
    allContributorsJson {
      edges {
        node {
          contributor
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

export const Head = () => <SEO />
