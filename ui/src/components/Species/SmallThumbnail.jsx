import React from 'react'
import PropTypes from 'prop-types'
import { graphql, useStaticQuery } from 'gatsby'
import { GatsbyImage as Img, getImage } from 'gatsby-plugin-image'

import { extractNodes } from 'util/data'

/**
 * Retrieve a fixed-size, blur-up image for each species in `src/images/species`:
 * {species: <img>, ...}
 *
 * <Img image={getImage(thumbnails[species])} />
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
              gatsbyImageData(
                width: 150
                height: 100
                layout: CONSTRAINED
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

export const useSmallThumbnail = (species) => {
  const thumbnails = useSmallThumbnails()

  return thumbnails[species] || null
}

const SmallThumbnail = ({ species, ...props }) => {
  const thumbnail = useSmallThumbnail(species)

  return thumbnail ? (
    <Img image={thumbnail} alt={`species photo for ${species}`} {...props} />
  ) : null
}

SmallThumbnail.propTypes = {
  species: PropTypes.string.isRequired,
}

export default SmallThumbnail
