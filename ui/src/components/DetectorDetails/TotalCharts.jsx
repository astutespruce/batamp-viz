import React from 'react'
import PropTypes from 'prop-types'

import { HorizontalBarChart } from 'components/Chart'
import styled from 'style'
import MissingSpeciesWarning from './MissingSpeciesWarning'
import { SPECIES } from '../../../config/constants'

const Wrapper = styled.div``

const Warning = styled(MissingSpeciesWarning).attrs({ mb: '1rem' })``

const TotalCharts = ({ data, selectedSpecies, max }) => {
  let detectedSelected = false
  let selectedSppChart = null
  if (selectedSpecies) {
    const selectedSppData = data.find(([spp]) => spp === selectedSpecies)

    if (selectedSppData) {
      detectedSelected = true
      selectedSppChart = (
        <HorizontalBarChart
          label={SPECIES[selectedSpecies].commonName}
          sublabel={`(${SPECIES[selectedSpecies].sciName})`}
          quantity={selectedSppData[1]}
          max={max}
          highlight
        />
      )
    }
  }

  return (
    <Wrapper>
      {selectedSpecies ? (
        <>
          {detectedSelected ? (
            selectedSppChart
          ) : (
            <Warning species={selectedSpecies} />
          )}
        </>
      ) : null}

      {data
        .filter(([spp]) => spp !== selectedSpecies)
        .map(([spp, total]) => (
          <HorizontalBarChart
            key={spp}
            label={SPECIES[spp].commonName}
            sublabel={`(${SPECIES[spp].sciName})`}
            quantity={total}
            max={max}
          />
        ))}
    </Wrapper>
  )
}

TotalCharts.propTypes = {
  data: PropTypes.arrayOf(PropTypes.array).isRequired,
  selectedSpecies: PropTypes.string,
  max: PropTypes.number.isRequired,
}

TotalCharts.defaultProps = {
  selectedSpecies: null,
}

export default TotalCharts
