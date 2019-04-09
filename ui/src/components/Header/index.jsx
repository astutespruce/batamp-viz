import React from 'react'
import PropTypes from 'prop-types'

import { Link } from 'components/Link'

import styled, { themeGet, themePx } from 'util/style'

const Wrapper = styled.div`
  background: ${themeGet('colors.primary.800')};
  padding: ${themePx('space.3')} ${themePx('space.3')};
  flex: 0 0 auto;
`

const Title = styled.h1`
  margin: 0;

  & * {
    color: #fff;
    text-decoration: none;
  }
`

const Header = ({ siteTitle }) => (
  <Wrapper as="header">
    <Title>
      <Link to="/">{siteTitle}</Link>
    </Title>
  </Wrapper>
)

Header.propTypes = {
  siteTitle: PropTypes.string.isRequired,
}

export default Header
