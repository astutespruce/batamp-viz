import React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'

import { Box, Container, Heading } from 'theme-ui'

import { OutboundLink } from 'components/Link'

const HeaderImage = ({
  image,
  height,
  minHeight,
  title,
  subtitle,
  credits,
  position,
}) => (
  <Box
    sx={{
      height,
      minHeight,
      mt: 0,
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      '& img': {
        objectPosition: `center ${position} !important`,
      },
    }}
  >
    <GatsbyImage
      image={getImage(image)}
      alt=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
      }}
    />

    {title ? (
      <>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background:
              'linear-gradient(to bottom, rgba(0, 0, 0, 1), 50%, rgba(0, 0, 0, 0))',
          }}
        />
        <Container
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '3rem',
            textShadow: '1px 1px 3px #000',
            borderTop: '3px solid #FFF',
            borderBottom: '3px solid #FFF',
          }}
        >
          <Heading
            as="h1"
            sx={{
              fontSize: ['3rem', '3rem', '5rem'],
              color: '#FFF',
              mb: '0.5rem',
            }}
          >
            {title}
          </Heading>
          {subtitle ? (
            <Heading
              as="h3"
              sx={{ fontSize: ['1.5rem', '2rem', '3rem'], color: '#FFF', m: 0 }}
            >
              {subtitle}
            </Heading>
          ) : null}
        </Container>
      </>
    ) : null}

    {credits ? (
      <Box
        sx={{
          color: 'grey.3',
          bg: 'rgba(0,0,0, 0.5)',
          position: 'absolute',
          zIndex: 1000,
          bottom: 0,
          right: 0,
          p: '0.5em',
          fontSize: 'smaller',
          textAlign: 'right',
        }}
      >
        Photo:&nbsp;
        <OutboundLink to={credits.url} sx={{ color: 'grey.3' }}>
          {credits.author}
        </OutboundLink>
      </Box>
    ) : null}
  </Box>
)

HeaderImage.propTypes = {
  image: PropTypes.any.isRequired,
  height: PropTypes.string,
  minHeight: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  credits: PropTypes.shape({
    url: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
  }),
  position: PropTypes.string,
}

HeaderImage.defaultProps = {
  height: '60vh',
  minHeight: '20rem',
  title: '',
  subtitle: '',
  credits: null,
  position: 'center',
}

export default HeaderImage
