import React from 'react'
import PropTypes from 'prop-types'

import { OutboundLink as Link } from 'gatsby-plugin-google-gtag'

const OutboundLink = ({ to, target, children, className }) => (
  <Link href={to} target={target} className={className} rel="noopener">
    {children}
  </Link>
)

OutboundLink.propTypes = {
  to: PropTypes.string.isRequired,
  target: PropTypes.string,
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
}

OutboundLink.defaultProps = {
  target: '_blank',
  className: ``,
}

export default OutboundLink
