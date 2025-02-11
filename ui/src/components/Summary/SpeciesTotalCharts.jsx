import React from 'react'
import PropTypes from 'prop-types'
import { Box, Text } from 'theme-ui'

import { SPECIES } from 'config'
import { formatNumber, quantityLabel } from 'util/format'
import SpeciesTotalChart from './SpeciesTotalChart'

const SpeciesTotalCharts = ({ type, speciesID, data, max }) => {
  const sppData = Object.entries(data)
    .map(([id, { total, detectorNights: sppDetectorNights }]) => {
      const { commonName, sciName } = SPECIES[id]

      return {
        id,
        commonName,
        sciName,
        total,
        detectorNights: sppDetectorNights,
      }
    })
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

  const nondetectedSpp = sppData.filter(
    ({ id, total }) => total === 0 && id !== speciesID
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
            type === 'hex'
              ? `monitored on ${formatNumber(selectedSppData.detectorNights)} ${quantityLabel('nights', selectedSppData.detectorNights)}`
              : null
          }
          highlight
        />
      ) : null}

      {sppData
        // only show nonzero values unless selected species
        .filter(({ id, total }) => total > 0 && id !== speciesID)
        .map(({ id, detectorNights: sppDetectorNights, ...rest }) => (
          <SpeciesTotalChart
            key={id}
            {...rest}
            max={max}
            note={
              type === 'hex'
                ? `monitored on ${formatNumber(sppDetectorNights)} ${quantityLabel('nights', sppDetectorNights)}`
                : null
            }
          />
        ))}

      {nondetectedSpp.length > 0 ? (
        <Box sx={{ mt: '2rem' }}>
          <Text sx={{ fontWeight: 'bold' }}>
            Species monitored but not detected on any night:
          </Text>

          <Box
            as="ul"
            sx={{
              lineHeight: 1.2,
              mt: '0.5rem',
              'li+li': {
                mt: '0.5rem',
              },
            }}
          >
            {nondetectedSpp.map(
              ({ commonName, sciName, detectorNights: sppDetectorNights }) => (
                <li key={commonName}>
                  {commonName} ({sciName})
                  {type === 'hex' ? (
                    <Text variant="help" sx={{ fontSize: 0 }}>
                      monitored on {formatNumber(sppDetectorNights)}{' '}
                      {quantityLabel('nights', sppDetectorNights)}
                    </Text>
                  ) : null}
                </li>
              )
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

SpeciesTotalCharts.propTypes = {
  type: PropTypes.string.isRequired,
  speciesID: PropTypes.string, // NOTE: speciesID will always be present in data
  data: PropTypes.object.isRequired,
  max: PropTypes.number.isRequired,
}

SpeciesTotalCharts.defaultProps = {
  speciesID: null,
}

export default SpeciesTotalCharts
