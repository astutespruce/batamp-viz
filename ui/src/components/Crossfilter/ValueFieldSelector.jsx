import React from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import { ToggleButton as BaseButton } from 'components/Button'
import styled, { themeGet } from 'style'

import { useCrossfilter } from './Context'
import { METRIC_LABELS } from '../../../config/constants'

const Wrapper = styled(Flex).attrs({
  alignItems: 'center',
  justifyContent: 'center',
})``

const Label = styled.div`
  margin-right: 0.5em;
  color: ${themeGet('colors.grey.900')};
`

const ToggleButton = styled(BaseButton)`
  button {
    flex-grow: 1;
    padding: 4px 8px;
    font-size: smaller;
    font-weight: normal;
`

const ValueFieldSelector = ({ fields }) => {
  const { setValueField, state: {valueField} } = useCrossfilter()

  const handleChange = field => {
    setValueField(field)
  }

  const options = fields.map(f => ({
    value: f,
    label: METRIC_LABELS[f],
  }))

  return (
    <Wrapper>
      <Label>metric to display:</Label>
      <ToggleButton
        value={valueField}
        options={options}
        onChange={handleChange}
      />
    </Wrapper>
  )
}

ValueFieldSelector.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default ValueFieldSelector
