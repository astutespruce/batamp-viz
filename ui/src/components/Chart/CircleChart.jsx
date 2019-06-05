import React from 'react'
import PropTypes from 'prop-types'

const CircleChart = ({values, max}) => {
    return (
        <div>
            
        </div>
    )
}

CircleChart.propTypes = {
values: PropTypes.arrayOf(PropTypes.number).isRequired,
max: PropTypes.number.isRequired
}

export default CircleChart
