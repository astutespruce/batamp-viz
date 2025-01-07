import React from 'react'
import { Box, Flex } from 'theme-ui'

import { ToggleButton } from 'components/Button'
import { METRIC_LABELS } from 'config'
import { useCrossfilter } from './Context'

const ValueFieldSelector = () => {
  const {
    setValueField,
    state: {
      metric: { field },
    },
  } = useCrossfilter()

  const fields = ['detections', 'detectionNights', 'detectors']

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
        value={field}
        options={options}
        onChange={setValueField}
      />
    </Flex>
  )
}

export default ValueFieldSelector
