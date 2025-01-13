import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { escape } from 'arquero'
import { Flex } from 'theme-ui'

import Detector from './Detector'
import Iterator from './Iterator'

// IMPORTANT: the key param is used where this is called to force a complete
// re-mount of this component on change to siteId
const DetectorDetails = ({
  siteId,
  table,
  detectorsTable,
  speciesID,
  map,
  onClose,
}) => {
  const [index, setIndex] = useState(0)

  const detectorIds = useMemo(
    () => detectorsTable.filter(escape((d) => d.siteId === siteId)).array('id'),
    [detectorsTable, siteId]
  )

  return (
    <Flex sx={{ flexDirection: 'column', height: '100%' }}>
      {detectorIds.length > 1 ? (
        <Iterator
          index={index}
          onChange={setIndex}
          count={detectorIds.length}
        />
      ) : null}

      <Detector
        detector={{
          ...detectorsTable
            .filter(escape((d) => d.id === detectorIds[index]))
            .objects()[0],
          table: table.filter(escape((d) => d.detId === detectorIds[index])),
        }}
        speciesID={speciesID}
        map={map}
        onClose={onClose}
      />
    </Flex>
  )
}

DetectorDetails.propTypes = {
  siteId: PropTypes.number.isRequired,
  table: PropTypes.object.isRequired, // full table including all species for all detectors
  detectorsTable: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  speciesID: PropTypes.string,
  map: PropTypes.object,
}

DetectorDetails.defaultProps = {
  speciesID: null,
  map: null,
}

export default DetectorDetails
