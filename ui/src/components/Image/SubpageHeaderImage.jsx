import React from 'react'
import PropTypes from 'prop-types'
import Img from 'gatsby-image'

import { Text } from 'components/Text'
import { Container } from 'components/Grid'

import styled, { themeGet } from 'style'

const Wrapper = styled.div`
  margin-top: 0;
  height: ${({ height }) => height};
  min-height: ${({ minHeight }) => minHeight};
  width: 100%;
  position: relative;
  overflow: hidden;
`

const StyledImage = styled(Img)`
  position: absolute !important;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  img {
    object-position: center ${({ position }) => position} !important;
  }
`

const TitleContainer = styled(Container)`
  position: absolute;
  left: 0;
  right: 0;
  top: 3rem;
  text-shadow: 1px 1px 3px #000;
  // border-top: 3px solid #fff;
  // border-bottom: 3px solid #fff;
`

const Title = styled(Text).attrs({
  as: 'h1',
  fontSize: ['2rem', '2rem', '3rem'],
})`
  color: #fff;
  margin: 0 0 0.5rem 0;
`

const ImageCredits = styled.div`
  color: ${themeGet('colors.grey.300')};
  background: rgba(0, 0, 0, 0.5);
  position: absolute;
  z-index: 1000;
  bottom: 0;
  right: 0;
  padding: 0.5em;
  font-size: smaller;
  text-align: right;

  a {
    color: ${themeGet('colors.grey.300')};
  }
`

const SubpageHeaderImage = ({
  image,
  height,
  minHeight,
  title,
  credits,
  position,
}) => (
  <Wrapper height={height} minHeight={minHeight}>
    <StyledImage fluid={image} position={position} />

    {title ? (
      <>
        <TitleContainer>
          <Title>{title}</Title>
        </TitleContainer>
      </>
    ) : null}

    {credits ? (
      <ImageCredits>
        Photo:&nbsp;
        <a href={credits.url} target="_blank" rel="noopener noreferrer">
          {credits.author}
        </a>
      </ImageCredits>
    ) : null}
  </Wrapper>
)

SubpageHeaderImage.propTypes = {
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

SubpageHeaderImage.defaultProps = {
  height: '60vh',
  minHeight: '20rem',
  title: '',
  subtitle: '',
  credits: null,
  position: 'center',
}

export default SubpageHeaderImage
