import React from 'react'

import styled from 'style'
import Flex from './Flex'
import Box from './Box'

export const Columns = props => (
  <Flex
    flexWrap={['wrap', 'nowrap']}
    justifyContent="space-between"
    {...props}
    mx="-1rem"
    width="calc(100% + 2rem)" // expand to fill the space, accounting for the negative margins
  />
)

export const Column = props => <Box flex="1 1 auto" px="1rem" {...props} />

export const RightColumn = styled(Column)`
  text-align: right;
`
