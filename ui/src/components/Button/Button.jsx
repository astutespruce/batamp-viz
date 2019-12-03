import React from 'react'
import PropTypes from 'prop-types'
import { Button as BaseButton } from 'rebass'

import styled, { themeGet } from 'style'

export const DefaultButton = styled(BaseButton).attrs({
  borderRadius: 8,
})`
  background-color: ${themeGet('colors.grey.800')};

  opacity: 1;
  transition: opacity 0.25s linear;

  &:hover {
    opacity: 0.8;
  }
`

export const PrimaryButton = styled(DefaultButton)`
  background-color: ${themeGet('colors.primary.700')};
`

export const SecondaryButton = styled(DefaultButton)`
  background-color: ${themeGet('colors.primary.500')};
`

export const DisabledButton = styled(DefaultButton).attrs({
  disabled: true,
})`
  background-color: ${themeGet('colors.grey.300')};
  cursor: default;
  &:hover {
    opacity: inherit;
  }
`

export const Button = ({
  children,
  primary,
  secondary,
  disabled,
  onClick,
  ...props
}) => {
  let StyledButton = null
  if (primary) {
    StyledButton = PrimaryButton
  } else if (secondary) {
    StyledButton = SecondaryButton
  } else if (disabled) {
    StyledButton = DisabledButton
  } else {
    StyledButton = DefaultButton
  }

  return (
    <StyledButton onClick={onClick} {...props}>
      {children}
    </StyledButton>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
}

Button.defaultProps = {
  primary: false,
  secondary: false,
  disabled: false,
  onClick: () => {},
}

export default Button
