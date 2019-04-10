import React from 'react'
import PropTypes from 'prop-types'

import SEO from 'components/SEO'
import Header from 'components/Header'
import { Flex } from 'components/Grid'
import { FluidImage } from 'components/Image'
import styled, { ThemeProvider, theme } from 'util/style'
import config from '../../../config/meta'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Content = styled.div`
  flex: 1 1 auto;
`

const Layout = ({ children, title, headerImage }) => {
  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <SEO title={title || config.siteTitle} />
        <Header siteTitle={config.siteTitle} />
        {headerImage && (
          <FluidImage
            image={headerImage.img.childImageSharp.fluid}
            height="20vh"
            minHeight="30rem"
            position="bottom"
            // credits={{
            //   url:
            //     'https://www.flickr.com/photos/mypubliclands/46056678782/in/album-72157699760909522/',
            //   author:
            //     'Michael Durham/Minden Pictures, Bat Conservation International',
            // }}
          />
        )}
        <Content>{children}</Content>
      </Wrapper>
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  headerImage: PropTypes.shape({
    img: PropTypes.object.isRequired,
    credits: PropTypes.shape({
      url: PropTypes.string,
      author: PropTypes.string,
    }),
  }),
  title: PropTypes.string,
}

Layout.defaultProps = {
  headerImage: null,
  title: '',
}

export default Layout
