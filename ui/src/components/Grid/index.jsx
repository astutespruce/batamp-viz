import { Flex, Box } from '@rebass/grid'
import { display } from 'styled-system'

import styled from 'style'
import Container from './Container'
import { Columns, Column } from './Columns'

// Annotate box so that it can be shown or hidden based on viewport size
const ResponsiveBox = styled(Box)`
  ${display}
`

export { Flex, Box, Container, Columns, Column, ResponsiveBox }
