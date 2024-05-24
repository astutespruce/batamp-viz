import React from 'react'
import PropTypes from 'prop-types'
import { Search as SearchIcon, TimesCircle } from '@emotion-icons/fa-solid'
import { Box, Flex, Input } from 'theme-ui'

const SearchInput = ({ value, placeholder, onChange }) => {
  const handleChange = ({ target: { value: newValue } }) => {
    onChange(newValue)
  }

  const handleReset = () => {
    onChange('')
  }

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '0.5rem',
        bg: '#FFF',
        borderRadius: '0.5rem',
        p: '0.5rem',
        lineHeight: 1,
        border: '1px solid',
        borderColor: 'grey.2',
        '&:focus-within': {
          borderColor: 'primary.8',
        },
      }}
    >
      <Box sx={{ color: 'grey.4', flex: '0 0 auto' }}>
        <SearchIcon size="1.25em" />
      </Box>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        sx={{
          flex: '1 1 auto',
          width: '100%',
          p: '0',
          outline: 'none',
          border: 'none',
        }}
      />
      <Box
        sx={{
          flex: '0 0 auto',
          visibility: value ? 'visible' : 'hidden',
          cursor: 'pointer',
          color: 'grey.4',
          transition: 'color 0.25s linear',
          '&:hover': { color: 'grey.6' },
        }}
        onClick={handleReset}
      >
        <TimesCircle size="1.25em" />
      </Box>
    </Flex>
  )
}

SearchInput.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

SearchInput.defaultProps = {
  value: '',
  placeholder: 'Search...',
}

export default SearchInput
