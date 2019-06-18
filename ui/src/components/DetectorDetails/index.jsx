import React, { useState, useLayoutEffect, memo } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'

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
  if (index >= detectors.size) {
    // we are rendering with a set of detectors different in size than our previous render
    return null
  }

  useLayoutEffect(() => {
    // reset to first index on new set of detectors
    setIndex(0)
  }, [detectors])

  const handleIteratorChange = newIndex => {
    setIndex(newIndex)
    onSetDetector(detectors.get(newIndex).get('id'))
  }

  return (
    <Wrapper>
      {detectors.size > 1 ? (
        <Iterator
          index={index}
          onChange={handleIteratorChange}
          count={detectors.size}
        />
      ) : null}

      <Details
        detector={detectors.get(index)}
        selectedSpecies={selectedSpecies}
        onClose={onClose}
      />
    </Wrapper>
  )
}

DetectorDetails.propTypes = {
  detectors: ImmutablePropTypes.listOf(
    ImmutablePropTypes.mapContains({
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
    prevDetectors.equals(nextDetectors)
)
