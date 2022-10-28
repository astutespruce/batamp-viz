import React from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import styled from 'style'
import { isUnsupported } from 'util/dom'
import UnsupportedBrowser from './UnsupportedBrowser'
import Header from './Header'
import SEO from './SEO'
import ClientOnly from './ClientOnly'

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
    <ClientOnly>
      {isUnsupported ? (
        <UnsupportedBrowser />
      ) : (
        <Wrapper>
          <SEO title={title} />
          <Header />
          <Content>{children}</Content>
        </Wrapper>
      )}
    </ClientOnly>
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
