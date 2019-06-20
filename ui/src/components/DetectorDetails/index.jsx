import React, { useState, useLayoutEffect, memo } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'dequal'

import styled from 'style'
import { Flex } from 'components/Grid'

import Details from './Details'
import Iterator from './Iterator'

const Wrapper = styled(Flex).attrs({
  flexDirection: 'column',
})``

const DetectorDetails = ({
  detectors,
  selectedSpecies,
  onSetDetector,
  onClose,
}) => {
  const [index, setIndex] = useState(0)

  if (index >= detectors.length) {
    // we are rendering with a set of detectors different in size than our previous render
    return null
  }

  useLayoutEffect(() => {
    // reset to first index on new set of detectors
    setIndex(0)
  }, [detectors])

  const handleIteratorChange = newIndex => {
    setIndex(newIndex)
    onSetDetector(detectors[newIndex].id)
  }

  return (
    <Wrapper>
      {detectors.length > 1 ? (
        <Iterator
          index={index}
          onChange={handleIteratorChange}
          count={detectors.length}
        />
      ) : null}

      <Details
        detector={detectors[index]}
        selectedSpecies={selectedSpecies}
        onClose={onClose}
      />
    </Wrapper>
  )
}

DetectorDetails.propTypes = {
  detectors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
    })
  ).isRequired,
  onSetDetector: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedSpecies: PropTypes.string,
}

DetectorDetails.defaultProps = {
  selectedSpecies: null,
}

// only rerender on updates to detectors
export default memo(
  DetectorDetails,
  ({ detectors: prevDetectors }, { detectors: nextDetectors }) =>
    isEqual(prevDetectors, nextDetectors)
)
