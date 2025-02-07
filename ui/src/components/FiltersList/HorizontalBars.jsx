import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { dequal } from 'dequal'

import Bar from './HorizontalBar'

const HorizontalBars = ({
  data,
  max,
  showCount,
  valueType,
  onToggleFilter,
}) => (
  <>
    {data.map(({ value, ...props }) => (
      <Bar
        key={value}
        value={value}
        {...props}
        max={max}
        showCount={showCount}
        valueType={valueType}
        onClick={onToggleFilter}
      />
    ))}
  </>
)

HorizontalBars.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  max: PropTypes.number.isRequired,
  showCount: PropTypes.bool,
  valueType: PropTypes.string,
  onToggleFilter: PropTypes.func.isRequired,
}

HorizontalBars.defaultProps = {
  showCount: true,
  valueType: 'count',
}

// Memoize as a function of data
export default memo(
  HorizontalBars,
  ({ data: prevData, max: prevMax }, { data: nextData, max: nextMax }) =>
    dequal(prevData, nextData) && prevMax === nextMax
)
