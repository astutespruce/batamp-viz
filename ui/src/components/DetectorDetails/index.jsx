import React, { useState, useLayoutEffect, memo } from 'react'
import PropTypes from 'prop-types'
import { dequal } from 'dequal'
import { escape } from 'arquero'

import { Flex } from 'theme-ui'

import Detector from './Detector'
import Iterator from './Iterator'

const DetectorDetails = ({ table, detectors, speciesID, map, onClose }) => {
  const [index, setIndex] = useState(0)

  useLayoutEffect(() => {
    // reset to first index on new set of detectors
    setIndex(0)
  }, [detectors, detectors.length])

  return (
    <Flex sx={{ flexDirection: 'column', height: '100%' }}>
      {detectors.length > 1 ? (
        <Iterator index={index} onChange={setIndex} count={detectors.length} />
      ) : null}

      <Detector
        detector={{
          ...detectors[index],
          table: table.filter(escape((d) => d.detId === detectors[index].id)),
        }}
        speciesID={speciesID}
        map={map}
        onClose={onClose}
      />
    </Flex>
  )
}

DetectorDetails.propTypes = {
  table: PropTypes.object.isRequired, // full table including all species for all detectors
  detectors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  speciesID: PropTypes.string,
  map: PropTypes.object,
}

DetectorDetails.defaultProps = {
  speciesID: null,
  map: null,
}

// only rerender on updates to detectors
export default memo(
  DetectorDetails,
  ({ detectors: prevDetectors }, { detectors: nextDetectors }) =>
    dequal(prevDetectors, nextDetectors)
)
