import React from 'react'
import PropTypes from 'prop-types'
import { FaSearch, FaRegTimesCircle } from 'react-icons/fa'

import { Flex } from 'components/Grid'
import styled, { themeGet } from 'style'

const Wrapper = styled(Flex).attrs({ alignItems: 'center' })`
  background: #fff;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
`

const Icon = styled(FaSearch)`
  color: ${themeGet('colors.grey.400')};
  width: 1rem;
  height: 1rem;
  margin-right: 0.5em;
`

const ResetIcon = styled(FaRegTimesCircle)`
  width: 1rem;
  height: 1rem;
  margin-left: 0.5em;
  visibility: ${({ visible }) => visible};
  cursor: pointer;

  color: ${themeGet('colors.grey.400')};
  transition: color 0.25s linear;
  &:hover {
    color: ${themeGet('colors.grey.600')};
  }
`

const Input = styled.input.attrs({
  type: 'text',
})`
  flex: 1 1 auto;
  width: 100%;
  padding: 0;
  outline: none;
  border: none;
`

const SearchInput = ({ value, placeholder, onChange, ...props }) => {
  const handleChange = ({ target: { value: newValue } }) => {
    onChange(newValue)
  }

  const handleReset = () => {
    onChange('')
  }

  return (
    <Wrapper {...props}>
      <Icon />
      <Input placeholder={placeholder} value={value} onChange={handleChange} />
      <ResetIcon visible={value ? 'visible' : 'hidden'} onClick={handleReset} />
    </Wrapper>
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
