import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { Container } from 'theme-ui'

import { HeaderImage } from 'components/Image'
import { Layout, SEO } from 'components/Layout'
import {
  ContributorsSection,
  CreditsSection,
  SummaryStats,
  TopSection,
} from 'blocks/home'

const IndexPage = ({ data: { headerImage: img } }) => (
  <Layout>
    <HeaderImage
      image={img}
      height="40vh"
      minHeight="32rem"
      position="bottom"
      credits={{
        author:
          'Silver-haired Bat (Lasionycteris noctivagans), José G. Martínez-Fonseca',
        url: 'https://www.instagram.com/svaldvard/?hl=en',
      }}
      title="Acoustic Monitoring"
      subtitle="is essential for helping study and conserve bats in North America."
    />
    <SummaryStats />

    <Container>
      <TopSection />
      <ContributorsSection />

      <CreditsSection />
    </Container>
  </Layout>
)

IndexPage.propTypes = {
  data: PropTypes.shape({
    headerImage: PropTypes.object.isRequired,
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
  }
`

export default IndexPage

export const Head = () => <SEO />
