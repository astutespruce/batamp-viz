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
export const useSmallThumbnails = () => {
  const data = useStaticQuery(graphql`
    query ProfileSmallThumbnailQuery {
      allFile(filter: { relativeDirectory: { eq: "species" } }) {
        edges {
          node {
            id
            species: name
            childImageSharp {
              fixed(width: 150, height: 100, quality: 100) {
                ...GatsbyImageSharpFixed
              }
            }
          }
        }
      }
    }
  `)

  return extractNodes(data.allFile).reduce(
    (prev, { species, childImageSharp: { fixed } }) => {
      /* eslint-disable no-param-reassign */
      prev[species] = fixed
      return prev
    },
    {}
  )
}

export const useSmallThumbnail = species => {
  const thumbnails = useSmallThumbnails()

  return thumbnails[species] || null
}

const SmallThumbnail = ({ species, ...props }) => {
  const thumbnail = useSmallThumbnail(species)

  return thumbnail ? <Img fixed={thumbnail} {...props} /> : null
}

SmallThumbnail.propTypes = {
  species: PropTypes.string.isRequired,
}

export default SmallThumbnail
