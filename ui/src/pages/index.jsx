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
        height="100vh"
        minHeight="40rem"
        position="bottom"
        credits={{
          author:
            'Michael Durham/Minden Pictures, Bat Conservation International',
          url:
            'https://www.flickr.com/photos/mypubliclands/46056678782/in/album-72157699760909522/',
        }}
        title="Monitoring Bat Species in North America"
        subtitle="is critical for detecting impacts from climate, disease, and development."
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
      years: PropTypes.number.isRequired,
      contributors: PropTypes.number.isRequired,
    }),
    allContributorsJson: PropTypes.shape({
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            contributor: PropTypes.string.isRequired,
            detections: PropTypes.number.isRequired,
            detectorNights: PropTypes.number.isRequired,
            species: PropTypes.arrayOf(PropTypes.string),
          }),
        })
      ).isRequired,
    }),
  }).isRequired,
}

export const pageQuery = graphql`
  query HomePageQuery {
    headerImage: file(relativePath: { eq: "46056678782_da46dcec08_o.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 3200) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
    summaryJson {
      admin1
      contributors
      nights: detectorNights
      years
      detections
      detectors
      species
    }
    allContributorsJson(sort: { fields: [detections], order: DESC }) {
      edges {
        node {
          contributor
          detections
          nights: detectorNights
          detectors
          species
        }
      }
    }
  }
`

export default IndexPage
