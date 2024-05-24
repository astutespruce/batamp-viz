// derived from: https://codepen.io/zeroskillz/pen/mPmENy

import React from 'react'
import PropTypes from 'prop-types'

import { formatNumber } from 'util/format'

const Donut = ({
  percent,
  percentLabel,
  percentSize,
  label,
  color,
  size,
  donutWidth,
  offset,
  isPercent,
  active,
  className,
  onClick,
}) => {
  const halfsize = size * 0.5
  const radius = halfsize - donutWidth * 0.5
  const circumference = 2 * Math.PI * radius
  const rotateval = `rotate(${
    (offset / 100) * 365 - 90
  } ${halfsize},${halfsize})`

  return (
    <svg
      width={`${size}px`}
      height={`${size}`}
      className={className}
      onClick={onClick}
    >
      <circle
        r={radius}
        cx={halfsize}
        cy={halfsize}
        stroke="#ededee" // grey.2
        strokeWidth={donutWidth}
        fill="transparent"
      />
      <circle
        r={radius}
        cx={halfsize}
        cy={halfsize}
        transform={rotateval}
        stroke={color}
        strokeWidth={donutWidth}
        strokeDasharray={`${(percent * circumference) / 100} ${circumference}`}
        fill="transparent"
      />
      <text
        className="donutchart-text"
        x={halfsize}
        y={halfsize}
        style={{
          textAnchor: 'middle',
          dominantBaseline: label ? '' : 'central',
          fontSize: `${percentSize * 0.8}px`,
        }}
      >
        {/* secondary.8 vs grey.8 */}
        <tspan fill={active ? '#550007' : '#6f6976'}>
          {percentLabel !== null
            ? percentLabel
            : formatNumber(percent, percent < 1 ? 1 : 0)}
        </tspan>

        {isPercent && (
          <tspan fill="#a19ea6" style={{ fontSize: `${percentSize * 0.7}px` }}>
            %
          </tspan>
        )}

        {label && (
          <tspan
            x={halfsize}
            y={halfsize + percentSize * 0.5}
            fill="#a19ea6"
            style={{
              fontSize: `${percentSize * 0.5}px`,
              textShadow: '0px 0px 2px #FFF',
            }}
          >
            {label}
          </tspan>
        )}
      </text>

      {active ? (
        <circle
          r={halfsize - 2}
          cx={halfsize}
          cy={halfsize}
          stroke="#004d84" // primary.6
          strokeWidth={4}
          fill="transparent"
        />
      ) : null}
    </svg>
  )
}

Donut.propTypes = {
  percent: PropTypes.number.isRequired, // percent, preferably integer
  percentLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  percentSize: PropTypes.number,
  label: PropTypes.string, // label placed below percent in middle of donut
  donutWidth: PropTypes.number, // width of donut
  color: PropTypes.string, // color of the indicator on the donut
  size: PropTypes.number, // width of the chart
  offset: PropTypes.number, // additional percentage to rotate the indicator (e.g., sum of percents of preceding charts in a series)
  isPercent: PropTypes.bool,
  active: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
}

Donut.defaultProps = {
  percentLabel: null,
  label: null,
  donutWidth: 26,
  color: '#abc4d6', // primary.3
  size: 200,
  percentSize: 30,
  offset: 0,
  isPercent: true,
  active: false,
  className: null,
  onClick: () => {},
}

export default Donut
