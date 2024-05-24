import React from 'react'

import { Box, Container, Flex, Heading } from 'theme-ui'
import { ExclamationTriangle } from '@emotion-icons/fa-solid'

const UnsupportedBrowser = () => (
  <Container>
    <Flex sx={{ mt: '2rem', gap: '1rem' }}>
      <Box sx={{ flex: '0 0 auto', color: 'grey.6' }}>
        <ExclamationTriangle size="3rem" />
      </Box>
      <Heading as="h1" sx={{ flex: '1 1 auto' }}>
        Unfortunately, you are using an unsupported browser.
        <br />
        <br />
        Please use a modern browser such as Google Chrome, Firefox, or Microsoft
        Edge.
      </Heading>
    </Flex>
  </Container>
)

export default UnsupportedBrowser
