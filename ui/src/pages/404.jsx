import React from 'react'
import { graphql } from 'gatsby'
import PropTypes from 'prop-types'

import { Layout, SEO } from 'components/Layout'
import { HeaderImage } from 'components/Image'

const NotFoundPage = ({ data: { headerImage } }) => (
  <Layout>
    <HeaderImage
      image={headerImage}
      height="100vh"
      position="bottom"
      credits={{
        url: 'https://www.flickr.com/photos/sloalan/7664772034/',
        author: 'Alan Schmierer',
      }}
      title="PAGE NOT FOUND"
      subtitle="You appear to be lost..."
    />
  </Layout>
)

NotFoundPage.propTypes = {
  data: PropTypes.shape({
    headerImage: PropTypes.object.isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query NotFoundPageQuery {
    headerImage: file(relativePath: { eq: "7664772034_68e27d16ff_o.jpg" }) {
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

export default NotFoundPage

export const Head = () => <SEO title="NOT FOUND" />
