import React from 'react'
import { Flex, Heading, Image, Text } from 'theme-ui'

import { Link, OutboundLink } from 'components/Link'
import LogoSVG from 'images/logo.svg'
import Navigation from './Navigation'
import Search from './Search'

const Header = () => (
  <Flex
    as="header"
    sx={{
      flex: '0 0 auto',
      flexWrap: ['wrap', 'nowrap'],
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '0.25rem solid',
      borderBottomColor: 'primary.8',
      p: '0.5rem',
      gap: '2rem',
    }}
  >
    <Flex sx={{ flex: '0 1 auto', alignItems: 'center', gap: '0.5rem' }}>
      <Image
        src={LogoSVG}
        sx={{ flex: '1 0 auto', height: '44px', width: '87px' }}
      />
      <Heading
        as="h1"
        sx={{
          flex: '1 1 auto',
          my: 0,
          fontSize: ['1rem', '1.25rem', '1.75rem'],
          lineHeight: 1,
          color: 'primary.8',
          '& a': {
            color: 'primary.8',
          },
        }}
      >
        <Link to="/" sx={{ textDecoration: 'none' }}>
          Bat Acoustic Monitoring <br />
          Visualization Tool
        </Link>
        <Text
          sx={{
            display: ['none', 'block'],
            fontSize: '1rem',
            fontStyle: 'italic',
            mt: '0.25rem',
          }}
        >
          (a companion to{' '}
          <OutboundLink
            to="https://batamp.databasin.org/"
            sx={{ textDecoration: 'underline' }}
          >
            BatAMP
          </OutboundLink>
          )
        </Text>
      </Heading>
    </Flex>
    <Flex
      sx={{
        flex: '1 1 auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        pr: '1rem',
      }}
    >
      <Navigation />
      <Search />
    </Flex>
  </Flex>
)

export default Header
