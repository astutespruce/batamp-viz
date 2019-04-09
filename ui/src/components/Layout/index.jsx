import React from 'react'
import PropTypes from 'prop-types'

import SEO from 'components/SEO'
import Header from 'components/Header'
import { Flex } from 'components/Grid'
import styled, { ThemeProvider, theme } from 'util/style'
import config from '../../../config/meta'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Content = styled.div`
  flex: 1 1 auto;
`

const Layout = ({ children, pageContext }) => {
  console.log(pageContext)

  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <SEO
          title={
            pageContext &&
            pageContext.frontmatter &&
            pageContext.frontmatter.title
              ? pageContext.frontmatter.title
              : config.siteTitle
          }
        />
        <Header siteTitle={config.siteTitle} />
        <Content>{children}</Content>
      </Wrapper>
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
