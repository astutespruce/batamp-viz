import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Text } from 'theme-ui'

const SortBar = ({ index, options, onChange }) => (
  <Text
    sx={{
      textAlign: ['left', 'right'],
      color: 'grey.6',
      lineHeight: 1.2,
    }}
  >
    sort:
    {options.map((option, idx) => (
      <Text
        key={option}
        sx={{
          display: 'inline',
          cursor: 'pointer',
          fontWeight: 'bold',
          ml: '0.5em',
          color: idx === index ? 'highlight.5' : 'inherit',
          '&:not(:first-of-type)': {
            pl: '0.5em',
            borderLeft: '1px solid',
            borderLeftColor: 'grey.4',
          },
          '&:hover': {
            color: idx === index ? 'highlight.5' : 'link',
          },
        }}
        onClick={() => onChange(idx)}
      >
        {option}
      </Text>
    ))}
  </Text>
)

SortBar.propTypes = {
  index: PropTypes.number.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
}

// only rerender on index change
export default memo(
  SortBar,
  ({ index: prevIndex }, { index: nextIndex }) => prevIndex === nextIndex
)
