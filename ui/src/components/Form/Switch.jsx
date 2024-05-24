import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Input, Label } from 'theme-ui'

const Switch = ({ enabled, label, onChange }) => {
  const handleChange = ({ target: { checked } }) => {
    onChange(!!checked)
  }

  return (
    <Flex sx={{ alignItems: 'center', gap: '0.5em' }}>
      <Input type="checkbox" checked={enabled} onChange={handleChange} />
      {label ? (
        <Label sx={{ color: 'grey.8', fontSize: '0.9em' }}>{label}</Label>
      ) : null}
    </Flex>
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
