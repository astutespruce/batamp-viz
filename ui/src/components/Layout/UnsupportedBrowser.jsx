import React from 'react'

import { Container, Heading } from 'theme-ui'

const UnsupportedBrowser = () => (
  <Container>
    <Heading as="h1" sx={{ flex: '1 1 auto' }}>
      Unfortunately, you are using an unsupported browser.
      <br />
      <br />
      Please use a modern browser such as Google Chrome, Firefox, or Microsoft
      Edge.
    </Heading>
  </Container>
)

export default UnsupportedBrowser
