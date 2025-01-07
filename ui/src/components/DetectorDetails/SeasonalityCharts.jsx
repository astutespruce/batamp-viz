import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'
import { Box } from 'theme-ui'

import BarChart from 'components/Chart/BarChart'
import { MONTH_LABELS } from 'config'
import MissingSpeciesWarning from './MissingSpeciesWarning'

const SeasonalityCharts = ({ data, selectedSpecies }) => {
  const maxBySpp = data.map(({ values }) => Math.max(...values))
  const max = Math.max(...maxBySpp)

  const chartScale = scaleLinear().domain([1, max]).range([6, 100])

  const sppData = data
    .filter(({ species }) => species !== selectedSpecies)
    .sort((left, right) =>
      // sort alphabetically on name
      left.commonName < right.commonName ? -1 : 1
    )

  let detectedSelected = false
  let selectedSppChart = null
  if (selectedSpecies) {
    const selectedSppData = data.find(
      ({ species }) => species === selectedSpecies
    )

    if (selectedSppData) {
      detectedSelected = true
      // else, species was not detected at this detector
      const { commonName, sciName, values } = selectedSppData
      selectedSppChart = (
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
          <BarChart
            title={commonName}
            subtitle={`(${sciName})`}
            data={values.map((d, i) => ({
              value: d,
              label: MONTH_LABELS[i].slice(0, 3),
            }))}
            scale={chartScale}
            highlight
          />
        </Box>
      )
    }
  }

  return (
    <Box>
      {selectedSpecies ? (
        <>
          {detectedSelected ? (
            selectedSppChart
          ) : (
            <MissingSpeciesWarning species={selectedSpecies} />
          )}
        </>
      ) : null}

      {sppData.map(({ species, commonName, sciName, values }) => (
        <Box
          key={species}
          sx={{
            '&:not(:first-of-type)': {
              mt: '1.5rem',
              pt: '1rem',
              borderTop: '2px solid',
              borderTopColor: 'grey.2',
            },
          }}
        >
          <BarChart
            title={commonName}
            subtitle={`(${sciName})`}
            data={values.map((d, i) => ({
              value: d,
              label: MONTH_LABELS[i].slice(0, 3),
            }))}
            scale={chartScale}
            highlight={species === selectedSpecies}
          />
        </Box>
      ))}
    </Box>
  )
}

SeasonalityCharts.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      species: PropTypes.string.isRequired,
      commonName: PropTypes.string.isRequired,
      sciName: PropTypes.string.isRequired,
      values: PropTypes.arrayOf(PropTypes.number).isRequired,
    })
  ).isRequired,
  selectedSpecies: PropTypes.string,
}

SeasonalityCharts.defaultProps = {
  selectedSpecies: null,
}

export default SeasonalityCharts
