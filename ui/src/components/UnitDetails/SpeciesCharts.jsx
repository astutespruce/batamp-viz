import React from 'react'
import PropTypes from 'prop-types'

const SpeciesCharts = ({ data }) => {
  const max = Math.max(...Array.from(data.map(([_, value]) => value)))

  return <div />
}

SpeciesCharts.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      species: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
}

export default SpeciesCharts
