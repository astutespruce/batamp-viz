import React from 'react'
import PropTypes from 'prop-types'
import { graphql, useStaticQuery } from 'gatsby'
import { GatsbyImage as Img, getImage } from 'gatsby-plugin-image'

import { extractNodes } from 'util/data'

/**
 * Retrieve a fixed-size, blur-up image for each species in `src/images/species`:
 * {species: <img>, ...}
 *
 * <Img fixed={getImage(thumbnails[species])} />
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
              gatsbyImageData(
                layout: FULL_WIDTH
                formats: [AUTO, WEBP]
                placeholder: BLURRED
                quality: 95
              )
            }
          }
        }
      }
    }
  `)

  return extractNodes(data.allFile).reduce(
    (prev, { species, childImageSharp: { gatsbyImageData } }) => {
      /* eslint-disable no-param-reassign */
      prev[species] = getImage(gatsbyImageData)
      return prev
    },
    {}
  )
}

export const useThumbnail = (species) => {
  const thumbnails = useThumbnails()

  return thumbnails[species] || null
}

const Thumbnail = ({ species, ...props }) => {
  const thumbnail = useThumbnail(species)

  return thumbnail ? (
    <Img image={thumbnail} alt={`species photo for ${species}`} {...props} />
  ) : null
}

Thumbnail.propTypes = {
  species: PropTypes.string.isRequired,
}

export default Thumbnail
