import React from 'react'
import { Flex, Text } from 'theme-ui'

import { Link } from 'components/Link'

const linkCSS = {
  display: 'block',
  textDecoration: 'none',
  color: 'link',
  fontWeight: 'bold',
  bg: 'primary.1',
  borderRadius: '0.5em',
  p: '0.5em 1em',
  '&:hover': {
    bg: 'primary.2',
    transition: 'background-color 0.5s',
  },
  fontSize: ['1rem', '1.1rem'],
}

const Navigation = () => (
  <Flex
    as="nav"
    sx={{
      mx: ['1rem', '1rem', '2rem'],
      flex: '0 0 auto',
      justifyContent: 'flex-end',
      gap: '1rem',
    }}
  >
    <Link to="/presence" sx={linkCSS}>
      <Text sx={{ display: ['none', 'none', 'none', 'block'] }}>
        Explore species occurrences
      </Text>
      <Text sx={{ display: ['block', 'block', 'block', 'none'] }}>
        Explore occurrences
      </Text>
    </Link>
    <Link to="/species" sx={linkCSS}>
      <Text sx={{ display: ['none', 'none', 'none', 'block'] }}>
        Explore individual species
      </Text>
      <Text sx={{ display: ['block', 'block', 'block', 'none'] }}>
        Explore species
      </Text>
    </Link>
  </Flex>
)

export default Navigation
