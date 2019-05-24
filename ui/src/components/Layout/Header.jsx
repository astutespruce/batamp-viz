import React from 'react'

import { ResponsiveText } from 'components/Text'
import { Flex } from 'components/Grid'
import { Link } from 'components/Link'
import styled, { themeGet } from 'style'
import Navigation from './Navigation'
import Search from './Search'

import { siteMetadata } from '../../../gatsby-config'

const Wrapper = styled(Flex).attrs({
  alignItems: 'center',
  justifyContent: 'space-between',
})`
  background: ${themeGet('colors.primary.800')};
  padding: 0.5rem 0.25rem;
  // flex: 0 0 auto;
`

const RootLink = styled(Link)`
  text-decoration: none;
  color: #fff;
`

const Title = styled(ResponsiveText).attrs({
  m: 0,
  as: 'h1',
  fontSize: ['1rem', '1rem', '1.5rem'],
  display: ['none', 'block'],
})`
  font-weight: normal;
`

const MobileTitle = styled(Title).attrs({ display: ['block', 'none'] })``

const SiteLogo = styled.div`
  margin: -0.25em 0.5em -0.25em 0;
  padding: 0.75em 1em;
  border-radius: 2rem;
  background: #fff;
  color: #aaa;
  font-size: 0.6em;
`

const Header = () => (
  <Wrapper as="header">
    <RootLink to="/">
      <Flex alignItems="center">
        <SiteLogo>logo</SiteLogo>
        <Title>{siteMetadata.title}</Title>
        <MobileTitle>{siteMetadata.shortTitle}</MobileTitle>
      </Flex>
    </RootLink>
    <Navigation />
    <Search />
  </Wrapper>
)

export default Header
