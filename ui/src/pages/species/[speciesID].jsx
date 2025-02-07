import React from 'react'
import PropTypes from 'prop-types'

import { SPECIES } from 'config'
import { ClientOnly, SEO } from 'components/Layout'
import SpeciesDetails from 'components/SpeciesDetails'

const SpeciesRoute = ({ params: { speciesID } }) => (
  <ClientOnly>
    <SpeciesDetails speciesID={speciesID} />
  </ClientOnly>
)

SpeciesRoute.propTypes = {
  params: PropTypes.shape({ speciesID: PropTypes.string.isRequired })
    .isRequired,
}

export default SpeciesRoute

/* eslint-disable-next-line react/prop-types */
export const Head = ({ params: { speciesID } }) => {
  if (speciesID) {
    const { commonName, sciName } = SPECIES[speciesID]
    return <SEO title={`${commonName} (${sciName})`} />
  }
  return <SEO title="" />
}
