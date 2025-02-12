import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import PropTypes from 'prop-types'

import { Layout, SEO } from 'components/Layout'
import { HeaderImage } from 'components/Image'

const NotFoundPage = () => {
  const { headerImage } = useStaticQuery(graphql`
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
  `)

  return (
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
}

export default NotFoundPage

export const Head = () => <SEO title="NOT FOUND" />
