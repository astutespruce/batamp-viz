import React from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

import { SPECIES } from 'config'
import SpeciesTotalChart from './SpeciesTotalChart'

const SpeciesTotalCharts = ({
  displayField,
  countType,
  speciesID,
  data,
  max,
  detectorNights,
}) => {
  const countTypePrefix =
    countType === 'p' ? 'presence/absence' : 'activity/absence'

  const sppData = Object.entries(data)
    .map(
      ([id, { [displayField]: total, detectorNights: sppDetectorNights }]) => {
        const { commonName, sciName } = SPECIES[id]

        return {
          id,
          commonName,
          sciName,
          total,
          detectorNights: sppDetectorNights,
        }
      }
    )
    // only show nonzero values unless selected species
    .filter(({ id, total }) => total > 0 || id === speciesID)
    .sort(
      (
        { commonName: leftName, total: leftTotal },
        { commonName: rightName, total: rightTotal }
      ) => {
        if (leftTotal === rightTotal) {
          // sort alphabetically on name
          return leftName < rightName ? -1 : 1
        }
        // sort descending on quantity
        return leftTotal < rightTotal ? 1 : -1
      }
    )

  // always show selected species at the top, if specified
  const selectedSppData = sppData.find(({ id }) => id === speciesID)

  return (
    <Box sx={{ mt: '1.5rem' }}>
      {selectedSppData ? (
        <SpeciesTotalChart
          {...selectedSppData}
          max={max}
          note={
            selectedSppData.detectorNights < detectorNights
              ? `${countTypePrefix} reported on ${selectedSppData.detectorNights} of ${detectorNights} nights`
              : ''
          }
          highlight
        />
      ) : null}

      {sppData
        .filter(({ id }) => id !== speciesID)
        .map(({ id, detectorNights: sppDetectorNights, ...rest }) => (
          <SpeciesTotalChart
            key={id}
            {...rest}
            max={max}
            note={
              sppDetectorNights < detectorNights
                ? `${countTypePrefix} reported on ${sppDetectorNights} of ${detectorNights} nights`
                : ''
            }
          />
        ))}
    </Box>
  )
}

SpeciesTotalCharts.propTypes = {
  displayField: PropTypes.string.isRequired,
  countType: PropTypes.string.isRequired,
  speciesID: PropTypes.string, // NOTE: speciesID will always be present in data
  data: PropTypes.object.isRequired,
  max: PropTypes.number.isRequired,
  detectorNights: PropTypes.number.isRequired,
}

SpeciesTotalCharts.defaultProps = {
  speciesID: null,
}

export default SpeciesTotalCharts
