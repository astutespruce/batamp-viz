import React from 'react'
import PropTypes from 'prop-types'
import { AngleDoubleLeft, AngleDoubleRight } from '@emotion-icons/fa-solid'
import { Box, Flex, Text } from 'theme-ui'

const Iterator = ({ index, count, onChange }) => {
  const handleBack = () => {
    onChange(index - 1)
  }

  const handleForward = () => {
    onChange(index + 1)
  }
  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        flex: '0 0 auto',
        px: '0.75rem',
        py: '0.25rem',
        bg: 'grey.7',
        lineHeight: 1,
      }}
    >
      <Flex
        sx={{
          flex: '1 1 auto',
          color: '#FFF',
          cursor: 'pointer',
          '&:hover': {
            color: 'grey.9',
          },
        }}
      >
        {index > 0 ? (
          <Flex
            sx={{ alignItems: 'center', gap: '0.25rem' }}
            onClick={handleBack}
          >
            <AngleDoubleLeft size="1em" />
            <Text>previous</Text>
          </Flex>
        ) : null}
      </Flex>

      <Box
        sx={{
          flex: '1 1 auto',
          px: '0.5em',
          color: '#FFF',
          textAlign: 'center',
        }}
      >
        detector {index + 1} of {count}
      </Box>

      <Flex
        sx={{
          flex: '1 1 auto',
          gap: '0.5rem',
          justifyContent: 'flex-end',
          color: '#FFF',
          textAlign: 'right',
          cursor: 'pointer',
          '&:hover': {
            color: 'grey.9',
          },
        }}
      >
        {index < count - 1 ? (
          <Flex
            sx={{ alignItems: 'center', gap: '0.25rem' }}
            onClick={handleForward}
          >
            <div>next</div>
            <AngleDoubleRight size="1em" />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

Iterator.propTypes = {
  index: PropTypes.number,
  count: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
}

Iterator.defaultProps = {
  index: 0,
}

export default Iterator
