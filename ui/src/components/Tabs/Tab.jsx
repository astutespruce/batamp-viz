import React, { useRef, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

const Tab = ({ id, children, ...props }) => {
  const nodeRef = useRef(null)

  useLayoutEffect(() => {
    if (nodeRef.current) {
      // scroll to top
      nodeRef.current.scrollTo(0, 0)
    }
  }, [children])

  return (
    <Box ref={nodeRef} {...props}>
      {children}
    </Box>
  )
}

Tab.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
}

export default Tab
