import React from 'react'
import PropTypes from 'prop-types'
import { graphql, useStaticQuery } from 'gatsby'
import Img from 'gatsby-image'

import { extractNodes } from 'util/graphql'

/**
 * Retrieve a fixed-size, blur-up image for each species in `src/images/species`:
 * {species: <img>, ...}
 *
 * For use with gatsby-image "fixed" property:
 * <Img fixed={thumbnails[species]} />
 *
 *
 * NOTE: Due to the way graphql queries work at the moment, we have to do this for all
 * profile images, and then filter out the one we want.
 */

export const useThumbnails = () => {
  const data = useStaticQuery(graphql`
    query ProfileThumbnailQuery {
      allFile(filter: { relativeDirectory: { eq: "species" } }) {
        edges {
          node {
            id
            species: name
            childImageSharp {
              fluid(quality: 100) {
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
        }
      }
    }
  `)

  return extractNodes(data.allFile).reduce(
    (prev, { species, childImageSharp: { fluid } }) => {
      /* eslint-disable no-param-reassign */
      prev[species] = fluid
      return prev
    },
    {}
  )
}

export const useThumbnail = species => {
  const thumbnails = useThumbnails()

  return thumbnails[species] || null
}

const Thumbnail = ({ species, ...props }) => {
  const thumbnail = useThumbnail(species)

  return thumbnail ? <Img fluid={thumbnail} {...props} /> : null
}

Thumbnail.propTypes = {
  species: PropTypes.string.isRequired,
}

export default Thumbnail
