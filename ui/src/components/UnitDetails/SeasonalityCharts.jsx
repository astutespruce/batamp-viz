import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'

// import { BarChart } from 'components/Chart'
import BarChart, { Title as ChartTitle } from 'components/Chart/BarChart'
import styled, { themeGet } from 'style'
import { MONTH_LABELS } from '../../../config/constants'

const Wrapper = styled.div``

const BarChartWrapper = styled.div`
  &:not(:first-child) {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid ${themeGet('colors.grey.300')};
  }

  ${ChartTitle} {
    text-align: center;
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
      {data.map(({ species, commonName, sciName, values }) => (
        <BarChartWrapper key={species}>
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
        </BarChartWrapper>
      ))}
    </Wrapper>
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
