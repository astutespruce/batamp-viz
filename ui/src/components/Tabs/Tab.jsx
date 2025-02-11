import React, { useRef, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

const Tab = ({ id, children }) => {
  const nodeRef = useRef(null)

  useLayoutEffect(() => {
    if (nodeRef.current) {
      // scroll to top
      nodeRef.current.scrollTo(0, 0)
    }
  }, [children])

  return (
    <Box
      id={id}
      ref={nodeRef}
      sx={{
        flex: '1 1 auto',
        pt: '1rem',
        px: '1rem',
        pb: '2rem',
        overflowY: 'auto',
        overflowX: 'auto',
      }}
    >
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
