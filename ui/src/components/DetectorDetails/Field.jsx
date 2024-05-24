import React from 'react'
import PropTypes from 'prop-types'
import { Box, Heading } from 'theme-ui'

const Field = ({ label, children }) => (
  <Box
    sx={{
      '&:not(:first-of-type)': {
        mt: '0.5rem',
        pt: '0.5rem',
        borderTop: '1px solid',
        borderTopColor: 'grey.2',
      },
    }}
  >
    <Heading as="h4" sx={{ mb: 0 }}>
      {label}
    </Heading>
    <Box sx={{ ml: '1rem', color: 'grey.9' }}>{children}</Box>
  </Box>
)

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]).isRequired,
}

export default Field
