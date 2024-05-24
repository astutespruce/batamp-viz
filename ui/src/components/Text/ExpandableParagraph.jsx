import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Box, Paragraph, Text } from 'theme-ui'

const linkCSS = {
  display: 'inline',
  color: 'primary.5',
  '&:hover': { textDecoration: 'underline' },
}

const ExpandableParagraph = ({ snippet, children, sx }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen)
  }
  return (
    <Box sx={{ ...sx, cursor: 'pointer', lineHeight: 1.2 }} onClick={toggle}>
      {isOpen ? (
        <Paragraph>
          {children}
          <br />
          <Text sx={linkCSS}>Show less...</Text>
        </Paragraph>
      ) : (
        <Paragraph>
          {snippet} <Text sx={linkCSS}>Show more...</Text>
        </Paragraph>
      )}
    </Box>
  )
}

ExpandableParagraph.propTypes = {
  snippet: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.element]).isRequired,
  sx: PropTypes.object,
}

ExpandableParagraph.defaultProps = {
  sx: {},
}

export default ExpandableParagraph
