import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex } from 'theme-ui'

import { ToggleButton } from 'components/Button'
import { METRIC_LABELS } from 'config'
import { useCrossfilter } from './Context'

const ValueFieldSelector = ({ fields }) => {
  const {
    setValueField,
    state: { valueField },
  } = useCrossfilter()

  const handleChange = (field) => {
    setValueField(field)
  }

  const options = fields.map((f) => ({
    value: f,
    label: METRIC_LABELS[f],
  }))

  return (
    <Flex sx={{ alignItems: 'center', justifyContent: 'center', gap: '0.5em' }}>
      <Box sx={{ color: 'grey.9' }}>metric to display:</Box>
      <ToggleButton
        sx={{
          fontSize: 1,
          '& button': {
            py: '0.25rem',
          },
        }}
        value={valueField}
        options={options}
        onChange={handleChange}
      />
    </Flex>
  )
}

ValueFieldSelector.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default ValueFieldSelector
