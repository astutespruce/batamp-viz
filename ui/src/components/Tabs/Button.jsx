import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

const baseCSS = {
  textAlign: 'center',
  cursor: 'pointer',
  flex: '1 1 auto',
  p: '0.5rem',
  borderBottom: '1px solid',
  '&:hover': {
    bg: 'grey.2',
  },
}

const Button = ({ id, label, active, onClick }) => {
  const handleClick = () => {
    onClick(id)
  }
  return active ? (
    <Box
      sx={{
        ...baseCSS,
        color: 'grey.9',
        fontWeight: 'bold',
        borderBottomColor: 'transparent',
        bg: '#FFF',
        '&:not(:first-of-type)': {
          borderLeft: '1px solid',
          borderLeftColor: 'grey.3',
        },
        '&:not(:last-of-type)': {
          borderRight: '1px solid',
          borderRightColor: 'grey.3',
        },
        '&:hover': {
          bg: '#FFF',
        },
      }}
    >
      {label}
    </Box>
  ) : (
    <Box
      sx={{ ...baseCSS, color: 'grey.7', borderBottomColor: 'grey.3' }}
      onClick={handleClick}
    >
      {label}
    </Box>
  )
}

Button.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
}

Button.defaultProps = {
  active: false,
}

export default memo(
  Button,
  ({ id: prevId, active: prevActive }, { id: nextId, active: nextActive }) =>
    prevId === nextId && prevActive === nextActive
)
