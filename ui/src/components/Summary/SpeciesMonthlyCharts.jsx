import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'
import { Box } from 'theme-ui'

import { MONTH_LABELS, SPECIES } from 'config'
import SpeciesMonthlyChart from './SpeciesMonthlyChart'

// TODO: add monthly detectorNights
const SpeciesMonthlyCharts = ({ data, speciesID, valueType }) => {
  let max = 0

  // expand data to all months; backfill missing months with null
  const sppData = Object.entries(data)
    .map(([id, obs]) => {
      const { commonName, sciName } = SPECIES[id]

      let sppMax = 0
      let sppTotal = 0
      const months = MONTH_LABELS.map((label, i) => {
        const {
          // adjust 1-based indexing in data to 0-based indexing in MONTH_LABELS
          [i + 1]: { total, detectorNights: sppDetectorNights } = {
            total: null,
            detectorNights: 0,
          },
        } = obs
        max = Math.max(max, total || 0)
        sppMax = Math.max(sppMax, total || 0)
        sppTotal += total || 0

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
        total: sppTotal,
      }
    })
    // only show nonzero values unless selected species
    .filter(({ id, max: sppMax }) => sppMax > 0 || id === speciesID)
    .sort(({ total: leftTotal }, { total: rightTotal }) =>
      // sort by descending total
      leftTotal > rightTotal ? -1 : 1
    )

  // const max = Math.ceil(max / 2) * 2

  const chartScale = scaleLinear().domain([0, max]).range([0, 100]).nice()
  window.scale = chartScale

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
            valueType={valueType}
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
            <SpeciesMonthlyChart
              {...rest}
              scale={chartScale}
              valueType={valueType}
            />
          </Box>
        ))}
    </Box>
  )
}

SpeciesMonthlyCharts.propTypes = {
  data: PropTypes.object.isRequired,
  speciesID: PropTypes.string,
  valueType: PropTypes.string,
}

SpeciesMonthlyCharts.defaultProps = {
  speciesID: null,
  valueType: 'count',
}

export default SpeciesMonthlyCharts
