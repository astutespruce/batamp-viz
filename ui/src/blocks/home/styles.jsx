import { Box } from 'components/Grid'

import { Text } from 'components/Text'
import styled, { themeGet } from 'style'

export const Section = styled(Box).attrs({ py: '3rem' })`
  p {
    font-size: 1.1rem;
    color: ${themeGet('colors.grey.800')};
  }

  &:not(:first-child) {
    border-top: 0.5rem solid ${themeGet('colors.primary.800')};
  }
`

export const Title = styled(Text).attrs({
  fontSize: ['1.5rem', '2.5rem'],
  mb: '0.5rem',
  as: 'h2',
})`
  font-weight: bold;
  line-height: 1.2;
`
