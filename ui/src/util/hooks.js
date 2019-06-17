// ideas adapted from: https://github.com/kentcdodds/use-deep-compare-effect/blob/master/src/index.js
import { useRef, useEffect, useMemo } from 'react'
import deepEqual from 'dequal'

/**
 * Return the previous instance of the value if the incoming value is equal to it.
 * Specifically handles deep equality and ImmutableJS objects
 *
 * @param {any} value
 */
const memoizedIsEqual = value => {
  const ref = useRef(null)

  // if an ImmutableJS object, use its builtin equals function,
  // otherwise fall back to deep equality check
  if (value.equals) {
    if (!value.equals(ref.current)) {
      ref.current = value
    }
  } else if (!deepEqual(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}

/**
 * Same as native useEffect, but compare dependencies on deep rather than shallow equality.
 * Use with ImmutableJS objects that are created during each render to prevent them from
 * otherwise triggering new renders for equivalent values.
 * @param {function} callback
 * @param {Array} dependencies
 */
export const useIsEqualEffect = (callback, dependencies) => {
  useEffect(callback, dependencies.map(d => memoizedIsEqual(d)))
}

/**
 * Same as native useMemo, but compare dependencies on deep rather than shallow equality.
 * Use with ImmutableJS objects that are created during each render to prevent them from
 * otherwise triggering new renders for equivalent values.
 * @param {function} callback
 * @param {Array} dependencies
 */
export const useIsEqualMemo = (callback, dependencies) => {
  return useMemo(callback, dependencies.map(d => memoizedIsEqual(d)))
}
