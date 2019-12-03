import React from 'react'

import { Text, ResponsiveText } from 'components/Text'
import { Flex } from 'components/Grid'
import { Link, OutboundLink } from 'components/Link'
import styled, { themeGet } from 'style'
import LogoSVG from 'images/logo.svg'
import Navigation from './Navigation'
import Search from './Search'

const Wrapper = styled(Flex).attrs({
  alignItems: 'center',
  justifyContent: 'space-between',
})`
  border-bottom: 0.25rem solid ${themeGet('colors.primary.800')};
  padding: 0.5rem;
`

const SiteLogo = styled.img.attrs({ src: LogoSVG })`
  margin-right: 0.25rem;
  height: 2.5rem;
  width: auto;
`

const RootLink = styled(Link)`
  text-decoration: none;
  color: ${themeGet('colors.primary.800')} !important;
`

const Title = styled(ResponsiveText).attrs({
  my: 0,
  as: 'h1',
  fontSize: ['1rem', '1rem', '1.5rem'],
  display: ['none', 'block'],
})``

const Subtitle = styled(Text).attrs({
  fontSize: ['0.9rem', '0.9rem', '0.9rem'],
})`
  font-style: italic;
  color: ${themeGet('colors.primary.800')};

  a {
    color: ${themeGet('colors.primary.800')};
    text-decoration: underline;
  }
`

const MobileTitle = styled(Title).attrs({ display: ['block', 'none'] })``

const Header = () => (
  <Wrapper as="header">
    <Flex alignItems="center">
      <SiteLogo />

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
