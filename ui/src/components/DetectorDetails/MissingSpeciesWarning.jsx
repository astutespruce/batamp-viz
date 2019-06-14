import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { FaExclamationTriangle } from 'react-icons/fa'

import { Box } from 'components/Grid'
import styled, { themeGet } from 'style'
import { SPECIES } from '../../../config/constants'

const WarningIcon = styled(FaExclamationTriangle)`
  width: 1.5em;
  height: 1em;
`
const Highlight = styled(Box)`
  color: ${themeGet('colors.highlight.500')};
`

const MissingSpeciesWarning = ({ species, ...props }) => {
  return (
    <Highlight {...props}>
      <WarningIcon />
      {SPECIES[species].commonName} was not detected on any night.
    </Highlight>
  )
}

MissingSpeciesWarning.propTypes = {
  species: PropTypes.string.isRequired,
}

export default memo(MissingSpeciesWarning)
