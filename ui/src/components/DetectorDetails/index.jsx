import React, { useState } from 'react'
import PropTypes from 'prop-types'

import styled, { themeGet } from 'style'
import { Flex } from 'components/Grid'

import Details from './Details'
import Iterator from './Iterator'

const Wrapper = styled(Flex).attrs({
  flexDirection: 'column',
})``

const DetectorDetails = ({ detectors, species, onSetDetector }) => {
  const [index, setIndex] = useState(0)

  const handleIteratorChange = newIndex => {
    setIndex(newIndex)
    onSetDetector(detectors[newIndex].id)
  }

  return (
    <Wrapper>
      {detectors.length > 1 ? (
        <Iterator index={index} onChange={handleIteratorChange} />
      ) : null}

      <Details {...detectors[index]} species={species} />
    </Wrapper>
  )
}

DetectorDetails.propTypes = {
  detectors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSetDetector: PropTypes.func.isRequired,
  species: PropTypes.string,
}

DetectorDetails.defaultProps = {
  species: null,
}

export default DetectorDetails
