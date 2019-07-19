import React from 'react'

import { Flex } from 'components/Grid'
import { ResponsiveText } from 'components/Text'
import { Link } from 'components/Link'
import styled, { themeGet } from 'style'
import { hasWindow } from 'util/dom'
import nav from '../../../config/nav'

const NavBar = styled(Flex).attrs({
  mx: ['1rem', '1rem', '2rem'],
  flex: '1 0 auto',
  justifyContent: 'flex-end',
})`
  @media screen and (max-width: ${themeGet('breakpoints.0')}) {
    display: none;
  }
`

const NavLink = styled(Link)`
  color: #fff !important;
  text-decoration: none;
  border: 1px solid #fff;
  border-radius: 0.5em;
  padding: 0.1em 0.25em;

  &:not(:first-child) {
    margin-left: 2em;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transition: background-color 0.5s;
  }
`

const isActive = path => hasWindow && window.location.pathname.startsWith(path)

// Only shown on non-mobile viewports
const Navigation = () => (
  <NavBar as="nav">
    {nav.map(({ label, shortLabel, path }) => (
      <NavLink key={path} to={path} active={isActive(path)}>
        <ResponsiveText
          fontSize={['0.75rem', '0.75em', '1rem']}
          display={shortLabel ? ['none', 'none', 'block'] : null}
        >
          {label}
        </ResponsiveText>

        {shortLabel && (
          <ResponsiveText display={['block', 'block', 'none']}>
            {shortLabel}
          </ResponsiveText>
        )}
      </NavLink>
    ))}
  </NavBar>
)

export default Navigation
