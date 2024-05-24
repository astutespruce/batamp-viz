import React, { useState, useLayoutEffect, memo } from 'react'
import PropTypes from 'prop-types'
import { dequal } from 'dequal'

import { Flex } from 'theme-ui'

import Details from './Details'
import Iterator from './Iterator'

const DetectorDetails = ({
  detectors,
  selectedSpecies,
  onSetDetector,
  onClose,
}) => {
  const [index, setIndex] = useState(0)

  useLayoutEffect(() => {
    // reset to first index on new set of detectors
    setIndex(0)
  }, [detectors, detectors.length])

  const handleIteratorChange = (newIndex) => {
    setIndex(newIndex)
    onSetDetector(detectors[newIndex].id)
  }

  return (
    <Flex sx={{ flexDirection: 'column', height: '100%' }}>
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
    </Flex>
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
    dequal(prevDetectors, nextDetectors)
)
