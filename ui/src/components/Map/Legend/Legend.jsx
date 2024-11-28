import React, { useState, memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Text } from 'theme-ui'

import Circle from './Circle'
import Patch from './Patch'

const Legend = ({ title, subtitle, entries, note }) => {
  const [isClosed, setIsClosed] = useState(false)
  const toggle = () => setIsClosed((prevIsClosed) => !prevIsClosed)

  return (
    <Box
      sx={{
        cursor: 'pointer',
        position: 'absolute',
        maxWidth: '200px',
        right: '10px',
        bottom: '24px',
        zIndex: 10000,
        bg: '#FFF',
        borderRadius: '0.5rem',
        border: '1px solid',
        borderColor: 'grey.4',
        boxShadow: '1px 1px 4px #666',
        p: '0.25rem 0.5rem 0.5rem',
      }}
      onClick={toggle}
    >
      {isClosed ? (
        <Text sx={{ fontSize: ['0.8rem', '0.8rem', '1rem'], lineHeight: 1.2 }}>
          Legend
        </Text>
      ) : (
        <Box>
          <Box sx={{ mb: '0.5rem', lineHeight: 1.2 }}>
            <Text
              sx={{
                fontSize: 2,
                fontWeight: 'bold',
              }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text sx={{ fontSize: 1, color: 'grey.8' }}>{subtitle}</Text>
            ) : null}
          </Box>

          {entries.map(({ id, type, ...rest }, i) => (
            <Box
              key={id}
              sx={{
                mt: id === 'value0' && i > 0 ? '0.5rem' : 0,
              }}
            >
              {type === 'circle' ? (
                <Circle {...rest} />
              ) : (
                <Patch type={type} {...rest} />
              )}
            </Box>
          ))}

          {note ? (
            <Text
              sx={{
                fontSize: 0,
                color: 'grey.6',
                lineHeight: 1.1,
                mt: '0.5rem',
              }}
            >
              {note}
            </Text>
          ) : null}
        </Box>
      )}
    </Box>
  )
}

Legend.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
      ]).isRequired,
      color: PropTypes.string,
      borderColor: PropTypes.string,
      borderWidth: PropTypes.number,
      radius: PropTypes.number,
      height: PropTypes.string,
      opacity: PropTypes.number,
    })
  ).isRequired,
  note: PropTypes.string,
}

Legend.defaultProps = {
  subtitle: null,
  note: null,
}

export default memo(Legend)
