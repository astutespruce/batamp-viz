import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { ExclamationTriangle } from '@emotion-icons/fa-solid'
import { Box } from 'theme-ui'

import { SPECIES } from '../../../config/constants'

const MissingSpeciesWarning = ({ species }) => (
  <Box sx={{ color: 'highlight.5' }}>
    <ExclamationTriangle size="1.5em" />
    {SPECIES[species].commonName} was not detected on any night.
  </Box>
)

MissingSpeciesWarning.propTypes = {
  species: PropTypes.string.isRequired,
}

export default memo(MissingSpeciesWarning)
