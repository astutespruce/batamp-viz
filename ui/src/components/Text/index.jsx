import { Text as BaseText } from 'rebass'
import { display, fontSize, margin } from 'styled-system'

import styled, { themeGet } from 'style'

import ExpandableParagraph from './ExpandableParagraph'

const Text = styled(BaseText)`
  ${fontSize};
  ${margin};
`

const HelpText = styled(Text)`
  line-height: 1.4;
  color: ${themeGet('colors.grey.700')};
`

// annotate Text so that it can be shown or hidden based on viewport size
const ResponsiveText = styled(Text)`
  ${display}
`

export { Text, HelpText, ResponsiveText, ExpandableParagraph }
