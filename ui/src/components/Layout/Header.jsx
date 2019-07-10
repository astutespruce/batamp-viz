import React from 'react'

import { Text, ResponsiveText } from 'components/Text'
import { Flex } from 'components/Grid'
import { Link, OutboundLink } from 'components/Link'
import styled, { themeGet } from 'style'
import Navigation from './Navigation'
import Search from './Search'

const Wrapper = styled(Flex).attrs({
  alignItems: 'center',
  justifyContent: 'space-between',
})`
  background: ${themeGet('colors.primary.800')};
  padding: 0.5rem;
`

const RootLink = styled(Link)`
  text-decoration: none;
  color: #fff !important;
`

const Title = styled(ResponsiveText).attrs({
  my: 0,
  mx: '0.25rem',
  as: 'h1',
  fontSize: ['1rem', '1rem', '1.5rem'],
  display: ['none', 'block'],
})`
  font-weight: normal;
`

const Subtitle = styled(Text).attrs({
  fontSize: ['0.9rem', '0.9rem', '0.9rem'],
})`
  font-style: italic;
  color: #fff;

  a {
    color: #fff;
    text-decoration: underline;
  }
`

const MobileTitle = styled(Title).attrs({ display: ['block', 'none'] })``

// const SiteLogo = styled.div`
//   margin: -0.25em 0.5em -0.25em 0;
//   padding: 0.75em 1em;
//   border-radius: 2rem;
//   background: #fff;
//   color: #aaa;
//   font-size: 0.6em;
// `

const Header = () => (
  <Wrapper as="header">
    <Flex alignItems="center">
      {/* <SiteLogo>logo</SiteLogo> */}

      <Title>
        <RootLink to="/">Bat Acoustic Monitoring Visualization Tool</RootLink>
        <Subtitle>
          (a companion to{' '}
          <OutboundLink from="/" to="https://batamp.databasin.org/">
            BatAMP
          </OutboundLink>
          )
        </Subtitle>
      </Title>
      <MobileTitle>
        <RootLink to="/">Bat Acoustic Monitoring Visualization Tool</RootLink>
      </MobileTitle>
    </Flex>
    <Navigation />
    <Search />
  </Wrapper>
)

export default Header
