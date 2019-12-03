import { Box as BaseBox } from 'reflexbox/styled-components'
import { display } from 'styled-system'

import styled from 'style'

const Box = styled(BaseBox)`
  ${display};

  min-width: unset; /* this is getting initialized to 0, which is causing flexbox issues */
`

export default Box
