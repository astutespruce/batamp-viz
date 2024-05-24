import React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'

import { Box, Container, Heading } from 'theme-ui'

import { OutboundLink } from 'components/Link'

const SubpageHeaderImage = ({
  image,
  height,
  minHeight,
  title,
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
        <Container
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '3rem',
            textShadow: '1px 1px 3px #000',
          }}
        >
          <Heading
            as="h1"
            sx={{
              fontSize: ['2rem', '2rem', '3rem'],
              color: '#FFF',
              mb: '0.5rem',
            }}
          >
            {title}
          </Heading>
        </Container>
      </>
    ) : null}

    {credits ? (
      <Box
        sx={{
          color: 'grey.3',
          bg: 'rgba(0,0,0,0.5)',
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
        {credits.url ? (
          <OutboundLink to={credits.url} sx={{ color: 'grey.3' }}>
            {credits.author}
          </OutboundLink>
        ) : (
          credits.author
        )}
      </Box>
    ) : null}
  </Box>
)

SubpageHeaderImage.propTypes = {
  image: PropTypes.any.isRequired,
  height: PropTypes.string,
  minHeight: PropTypes.string,
  title: PropTypes.string,
  credits: PropTypes.shape({
    url: PropTypes.string,
    author: PropTypes.string.isRequired,
  }),
  position: PropTypes.string,
}

SubpageHeaderImage.defaultProps = {
  height: '60vh',
  minHeight: '20rem',
  title: '',
  credits: null,
  position: 'center',
}

export default SubpageHeaderImage
