import React from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

const Tab = ({ id, children, ...props }) => <Box {...props}>{children}</Box>

Tab.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
}

export default Tab
