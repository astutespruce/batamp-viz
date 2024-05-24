import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Input, Flex } from 'theme-ui'
import { Search as SearchIcon, TimesCircle } from '@emotion-icons/fa-solid'

const SearchBar = ({ value, placeholder, onChange }) => {
  const handleChange = ({ target: { value: newValue } }) => {
    onChange(newValue)
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <Box
      sx={{
        bg: 'grey.2',
        py: '0.5rem',
        px: '1rem',
        mt: '0.25rem',
        borderRadius: '0.5rem',
      }}
    >
      <Flex
        sx={{
          alignitems: 'center',
          flexWrap: 'no-wrap',
          py: '0.25rem',
          px: '0.5rem',
          borderRadius: '0.25rem',
          bg: '#FFF',
          color: 'grey.6',
          lineHeight: 1,
          border: '1px solid',
          borderColor: 'transparent',
          '&:focus-within': {
            borderColor: 'grey.6',
          },
        }}
      >
        <SearchIcon size="1.25rem" />
        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          sx={{
            flex: '1 1 auto',
            outline: 'none',
            border: 'none',
            py: '0.1em',
            px: '0.5em',
            color: 'grey.6',
            '&:active,&:focus': {
              color: 'grey.8',
            },
          }}
        />

        <Box
          sx={{
            visibility: value ? 'visible' : 'hidden',
            cursor: 'pointer',
            '&:hover': { color: 'grey.8' },
          }}
          onClick={handleClear}
        >
          <TimesCircle size="1.25rem" />
        </Box>
      </Flex>
    </Box>
  )
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

SearchBar.defaultProps = {
  placeholder: '',
}

// only rerender on value change
export default memo(
  SearchBar,
  ({ value: prevValue }, { value: nextValue }) => prevValue === nextValue
)
