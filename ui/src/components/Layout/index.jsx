import React from 'react'
import PropTypes from 'prop-types'

import SEO from 'components/SEO'

import { Flex } from 'components/Grid'
import styled, { ThemeProvider, theme } from 'style'
import { isUnsupported } from 'util/dom'
import UnsupportedBrowser from './UnsupportedBrowser'
import Header from './Header'
import { siteMetadata } from '../../../gatsby-config'

export { default as CallToActionBox } from './CallToActionBox'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Content = styled.div`
  height: 100%;
  flex: 1 1 auto;
  overflow-y: auto;
`

const Layout = ({ children, title }) => {
  return (
    <ThemeProvider theme={theme}>
      {isUnsupported ? (
        <UnsupportedBrowser />
      ) : (
        <Wrapper>
          <SEO title={title} />
          <Header />
          <Content>{children}</Content>
        </Wrapper>
      )}
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
}

Layout.defaultProps = {
  title: '',
}

export default Layout