import React from 'react'
import PropTypes from 'prop-types'
import { FaReply, FaShare } from 'react-icons/fa'

import { Flex, Box } from 'components/Grid'
import styled, { themeGet } from 'style'

const Wrapper = styled(Flex).attrs({
  justifyContent: 'space-between',
  flex: 0,
})`
  font-size: 0.9rem;
`

const Label = styled(Box).attrs({px: '0.5em'})`
color: ${themeGet('colors.grey.600')};
`

const Back = styled(Flex).attrs({ flex: 1 })`
  display: flex;
  align-items: middle;
  color: ${themeGet('colors.link')};
`
const Forward = styled(Back)`
  text-align: right;
`

const BackIcon = styled(FaReply)`
  width: 1em;
  height: 1em;
`

const ForwardIcon = styled(FaShare)`
  width: 1em;
  height: 1em;
`

const Iterator = ({ index, count, onChange }) => {
  const handleBack = () => {
    onChange(index - 1)
  }

  const handleForward = () => {
    onChange(index + 1)
  }
  return (
    <Wrapper>
      <Back>
        {index > 0 ? (
          <div onClick={handleBack}>
            <BackIcon />
            <div>previous</div>
          </div>
        ) : null}
      </Back>

      <Label>
          detector {index + 1} of {count}
      </Label>

      <Forward>
        {index < count ? (
          <div onClick={handleForward}>
            <ForwardIcon />
            <div>next</div>
          </div>
        ) : null}
      </Forward>
    </Wrapper>
  )
}

Iterator.propTypes = {
  index: PropTypes.number,
  count: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
}

Iterator.defaultProps = {
  index: 0,
}

export default Iterator
