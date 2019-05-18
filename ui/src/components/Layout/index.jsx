import React from 'react'
import PropTypes from 'prop-types'

import SEO from 'components/SEO'

import { Flex } from 'components/Grid'
import { FluidImage } from 'components/Image'
import styled, { ThemeProvider, theme } from 'style'
import { isUnsupported } from 'util/dom'
import UnsupportedBrowser from './UnsupportedBrowser'
import Header from './Header'
import { siteMetadata } from '../../../gatsby-config'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Content = styled.div`
  flex: 1 1 auto;
`

const Layout = ({ children, title, headerImage }) => {
  const { img, url, author } = headerImage

  return (
    <ThemeProvider theme={theme}>
      {isUnsupported ? (
        <UnsupportedBrowser />
      ) : (
        <Wrapper>
          <SEO title={title} />
          <Header />
          {img && (
            <FluidImage
              image={img.childImageSharp.fluid}
              height="20vh"
              minHeight="30rem"
              position="bottom"
              credits={{
                url,
                author,
              }}
            />
          )}
          <Content>{children}</Content>
        </Wrapper>
      )}
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  headerImage: PropTypes.shape({
    img: PropTypes.object,
    credits: PropTypes.shape({
      url: PropTypes.string,
      author: PropTypes.string,
    }),
  }),
  title: PropTypes.string,
}

Layout.defaultProps = {
  headerImage: {},
  title: '',
}

export default Layout
