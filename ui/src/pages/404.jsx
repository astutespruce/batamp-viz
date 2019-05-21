import React from 'react'
import { graphql } from 'gatsby'
import PropTypes from 'prop-types'

import { Link } from 'components/Link'
import Layout from 'components/Layout'
import SEO from 'components/SEO'
import { Container } from 'components/Grid'
import { HeaderImage } from 'components/Image'

const NotFoundPage = ({ data: { headerImage } }) => (
  <Layout>
    <SEO title="404: Not found" />
    <HeaderImage
      image={headerImage.childImageSharp.fluid}
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
        fluid(maxWidth: 3200) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`

export default NotFoundPage
