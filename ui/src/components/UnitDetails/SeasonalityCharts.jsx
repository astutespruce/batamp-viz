import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'

import { BarChart } from 'components/Chart'
import styled from 'style'
import { MONTH_LABELS } from '../../../config/constants'

const Wrapper = styled.div``

const BarChartWrapper = styled.div`
  &:not(:first-child) {
    margin-top: 2rem;
  }
`

const SeasonalityCharts = ({ data, selectedSpecies }) => {
  const maxBySpp = data.map(({ values }) => Math.max(...values))
  const max = Math.max(...maxBySpp)

  const chartScale = scaleLinear()
    .domain([1, max])
    .range([6, 100])

  return (
    <Wrapper>
      {data.map(({ species, label, values }) => (
        <BarChartWrapper key={species}>
          <BarChart
            title={label}
            data={values.map((d, i) => ({
              value: d,
              label: MONTH_LABELS[i].slice(0, 3),
            }))}
            scale={chartScale}
            highlight={species === selectedSpecies}
          />
        </BarChartWrapper>
      ))}
    </Wrapper>
  )
}

SeasonalityCharts.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      species: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      values: PropTypes.arrayOf(PropTypes.number).isRequired,
    })
  ).isRequired,
  selectedSpecies: PropTypes.string,
}

SeasonalityCharts.defaultProps = {
  selectedSpecies: null,
}

export default SeasonalityCharts
