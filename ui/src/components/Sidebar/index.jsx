import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex } from 'theme-ui'

import Header from './Header'

export { Header as SidebarHeader }

const Sidebar = ({ children, allowScroll }) => (
  <Box
    sx={{
      flex: '0 0 auto',
      width: ['100%', '350px', '470px'],
      height: '100%',
      borderRight: '1px solid #6f6976',
    }}
  >
    <Flex
      sx={{
        flexDirection: 'column',
        flex: '1 1 auto',
        height: '100%',
        overflowX: 'hidden',
        overflowY: allowScroll ? 'auto' : 'hidden',
      }}
    >
      {children}
    </Flex>
  </Box>
)

Sidebar.propTypes = {
  children: PropTypes.node.isRequired,
  allowScroll: PropTypes.bool,
}

Sidebar.defaultProps = {
  allowScroll: true,
}

export default Sidebar
