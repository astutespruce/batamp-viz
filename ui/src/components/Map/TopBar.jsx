import { Flex } from 'components/Grid'
import styled, { themeGet } from 'style'

const TopBar = styled(Flex).attrs({ padding: '0.5rem' })`
  background: #fff;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: 1px 1px 8px ${themeGet('colors.grey.900')};
  position: absolute;
  z-index: 1000;
  top: 0;
  left: 1rem;
`

export default TopBar
