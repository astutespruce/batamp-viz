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
    query MapThumbnailQuery {
      allFile(filter: { relativeDirectory: { eq: "maps" } }) {
        edges {
          node {
            id
            species: name
            childImageSharp {
              fixed(width: 175, height: 150, quality: 100) {
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

export const useThumbnail = species => {
  const thumbnails = useThumbnails()

  return thumbnails[species] || null
}

const MapThumbnail = ({ species, ...props }) => {
  const thumbnail = useThumbnail(species)
  return thumbnail ? <Img fixed={thumbnail} {...props} /> : null
}

MapThumbnail.propTypes = {
  species: PropTypes.string.isRequired,
}

export default MapThumbnail
