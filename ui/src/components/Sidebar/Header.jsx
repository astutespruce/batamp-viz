import React from 'react'
import PropTypes from 'prop-types'
import { SlidersH } from '@emotion-icons/fa-solid'
import { Box, Flex, Heading } from 'theme-ui'

const Header = ({ title }) => (
  <Flex
    sx={{
      alignItems: 'center',
      flexWrap: 'nowrap',
      lineHeight: 1,
      p: '1rem 1rem 0.25rem',
      flex: '0 0 auto',
      gap: '0.5rem',
    }}
  >
    <Box
      sx={{
        fontSize: ['1.5rem', '1.75rem'],
        mr: '0.25em',
        opacity: 0.6,
      }}
    >
      <SlidersH size="1em" />
    </Box>
    <Heading
      as="h2"
      sx={{
        fontSize: ['1.5rem', '1.75rem'],
        m: 0,
      }}
    >
      {title}
    </Heading>
  </Flex>
)

Header.propTypes = {
  title: PropTypes.string.isRequired,
}

export default Header
