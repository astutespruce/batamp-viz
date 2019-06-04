import React from 'react'
import PropTypes from 'prop-types'
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'

import { Flex, Box } from 'components/Grid'
import styled, { themeGet } from 'style'

const Wrapper = styled(Flex).attrs({
  justifyContent: 'space-between',
  flex: 0,
  px: '1rem',
})`
  background: ${themeGet('colors.grey.700')};
  font-size: 0.9rem;
`

const Label = styled(Box).attrs({ px: '0.5em', flex: 1 })`
  color: #fff;
  text-align: center;
`

const Back = styled(Flex).attrs({ flex: 1 })`
  color: #fff;
  line-height: 1;
`
const Forward = styled(Back).attrs({ justifyContent: 'flex-end' })`
  text-align: right;
`

const BackIcon = styled(FaAngleDoubleLeft)`
  width: 1em;
  height: 1em;
`

const ForwardIcon = styled(FaAngleDoubleRight)`
  width: 1em;
  height: 1em;
`

const Link = styled(Flex).attrs({ alignItems: 'center' })`
  cursor: pointer;
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
          <Link onClick={handleBack}>
            <BackIcon />
            <div>previous</div>
          </Link>
        ) : null}
      </Back>

      <Label>
        detector {index + 1} of {count}
      </Label>

      <Forward>
        {index < count - 1 ? (
          <Link onClick={handleForward}>
            <div>next</div>
            <ForwardIcon />
          </Link>
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
