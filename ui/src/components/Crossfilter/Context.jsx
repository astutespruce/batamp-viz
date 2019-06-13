import React, { createContext, useContext } from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import PropTypes from 'prop-types'

import { Crossfilter } from './Crossfilter'

/**
 * Provide Crossfilter as a context so that components deeper in the
 * component tree can access crossfilter state or dispatch.
 */
export const Context = createContext()
export const Provider = ({ data, filters, options, children }) => {
  const value = Crossfilter(data, filters, options)

  return <Context.Provider value={value}>{children}</Context.Provider>
}

Provider.propTypes = {
  data: ImmutablePropTypes.list.isRequired,
  filters: PropTypes.array.isRequired,
  options: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
}

Provider.defaultProps = {
  options: {},
}


// Hook for easier use in context
export const useCrossfilter = () => {
  return useContext(Context)
}
