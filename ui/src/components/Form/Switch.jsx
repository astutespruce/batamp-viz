import React from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import styled, { themeGet } from 'style'

const Wrapper = styled(Flex).attrs({ alignItems: 'center' })``

const Label = styled.label`
  color: ${themeGet('colors.grey.800')};
  font-size: 0.9em;
  margin-left: 0.5em;
`

const Toggle = styled.input.attrs({
  type: 'checkbox',
})``

const Switch = ({ enabled, label, onChange }) => {
  const handleChange = ({ target: { checked } }) => {
    onChange(!!checked)
  }

  return (
    <Wrapper>
      <Toggle checked={enabled} onChange={handleChange} />
      {label && <Label>{label}</Label>}
    </Wrapper>
  )
}

Switch.propTypes = {
  enabled: PropTypes.bool.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

Switch.defaultProps = {
  label: null,
}

export default Switch
