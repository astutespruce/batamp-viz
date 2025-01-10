import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'
import { Box } from 'theme-ui'

import { MONTH_LABELS, SPECIES } from 'config'
import SpeciesMonthlyChart from './SpeciesMonthlyChart'

// TODO: add monthly detectorNights
const SeasonalityCharts = ({ displayField, data, speciesID }) => {
  let max = 0

  // expand data to all months; backfill missing months with null
  const sppData = Object.entries(data)
    .map(([id, obs]) => {
      const { commonName, sciName } = SPECIES[id]

      let sppMax = 0
      const months = MONTH_LABELS.map((label, i) => {
        const {
          // adjust 1-based indexing in data to 0-based indexing in MONTH_LABELS
          [i + 1]: {
            [displayField]: total,
            detectorNights: sppDetectorNights,
          } = {
            [displayField]: null,
            detectorNights: 0,
          },
        } = obs
        max = Math.max(max, total || 0)
        sppMax = Math.max(sppMax, total || 0)

        return {
          label: label.slice(0, 3),
          total,
          detectorNights: sppDetectorNights,
        }
      })
      return {
        id,
        commonName,
        sciName,
        months,
        max: sppMax,
      }
    })
    // only show nonzero values unless selected species
    .filter(({ id, max: sppMax }) => sppMax > 0 || id === speciesID)
    .sort(({ commonName: leftName }, { commonName: rightName }) =>
      // sort alphabetically on name
      leftName < rightName ? -1 : 1
    )

  const chartScale = scaleLinear().domain([0, max]).range([2, 100])

  // always show selected species at the top, if specified
  const selectedSppData = sppData.find(({ id }) => id === speciesID)

  return (
    <Box sx={{ mt: '1.5rem' }}>
      {selectedSppData ? (
        <Box
          sx={{
            '&:not(:first-of-type)': {
              mt: '1.5rem',
              pt: '1rem',
              borderTop: '2px solid',
              borderTopColor: 'grey.2',
            },
          }}
        >
          <SpeciesMonthlyChart
            {...selectedSppData}
            scale={chartScale}
            highlight
            note={
              selectedSppData.max === 0 ? '(not detected on any night)' : ''
            }
          />
        </Box>
      ) : null}

      {sppData
        .filter(({ id }) => id !== speciesID)
        .map(({ id, ...rest }) => (
          <Box
            key={id}
            sx={{
              '&:not(:first-of-type)': {
                mt: '1.5rem',
                pt: '1rem',
                borderTop: '2px solid',
                borderTopColor: 'grey.2',
              },
            }}
          >
            <SpeciesMonthlyChart {...rest} scale={chartScale} />
          </Box>
        ))}
    </Box>
  )
}

SeasonalityCharts.propTypes = {
  displayField: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  speciesID: PropTypes.string,
}

SeasonalityCharts.defaultProps = {
  speciesID: null,
}

export default SeasonalityCharts
