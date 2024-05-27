import React from 'react'
import PropTypes from 'prop-types'
import { graphql, useStaticQuery } from 'gatsby'
import { GatsbyImage as Img, getImage } from 'gatsby-plugin-image'

import { extractNodes } from 'util/data'

export const useThumbnails = () => {
  const data = useStaticQuery(graphql`
    query MapThumbnailQuery {
      allFile(filter: { relativeDirectory: { eq: "maps" } }) {
        edges {
          node {
            id
            species: name
            childImageSharp {
              gatsbyImageData(
                layout: FULL_WIDTH
                formats: [PNG]
                placeholder: BLURRED
                quality: 100
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

const MapThumbnail = ({ species, ...props }) => {
  const thumbnail = useThumbnail(species)
  return thumbnail ? (
    <Img
      image={getImage(thumbnail)}
      alt={`species distribution map for ${species}`}
      {...props}
    />
  ) : null
}

MapThumbnail.propTypes = {
  species: PropTypes.string.isRequired,
}

export default MapThumbnail
