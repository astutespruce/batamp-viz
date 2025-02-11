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
      allFile(filter: { relativeDirectory: { eq: "speciesProfiles" } }) {
        edges {
          node {
            id
            species: name
            childImageSharp {
              gatsbyImageData(
                layout: FULL_WIDTH
                formats: [AUTO]
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

const Thumbnail = ({ speciesID, ...props }) => {
  const thumbnail = useThumbnail(speciesID)

  return thumbnail ? (
    <Img
      image={getImage(thumbnail)}
      alt={`species photo for ${speciesID}`}
      {...props}
    />
  ) : null
}

Thumbnail.propTypes = {
  speciesID: PropTypes.string.isRequired,
}

export default Thumbnail
