import React from 'react'
import PropTypes from 'prop-types'

import { SPECIES, SPECIES_REMAP } from 'config'
import { ClientOnly, SEO } from 'components/Layout'
import SpeciesDetails from 'components/SpeciesDetails'
import NotFound from 'pages/404'

const SpeciesRoute = ({ params: { speciesID } }) => {
  // handle updated taxonomy
  if (SPECIES_REMAP[speciesID]) {
    window.location.href = window.location.href.replace(
      `/${speciesID}`,
      `/${SPECIES_REMAP[speciesID]}`
    )
  }

  if (!SPECIES[speciesID]) {
    return <NotFound />
  }

  return (
    <ClientOnly>
      <SpeciesDetails speciesID={speciesID} />
    </ClientOnly>
  )
}

SpeciesRoute.propTypes = {
  params: PropTypes.shape({ speciesID: PropTypes.string.isRequired })
    .isRequired,
}

export default SpeciesRoute

/* eslint-disable-next-line react/prop-types */
export const Head = ({ params: { speciesID } }) => {
  if (speciesID && SPECIES[speciesID]) {
    const { commonName, sciName } = SPECIES[speciesID]
    return <SEO title={`${commonName} (${sciName})`} />
  }
  return <SEO title="" />
}
