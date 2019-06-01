import { useRef, useEffect } from 'react'

// derived from: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const useInterval = (callback, delay) => {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      savedCallback.current()
    }
    let id = null
    if (delay !== null) {
      id = setInterval(tick, delay)
    }
    // clear interval on unmount
    return () => {
      clearInterval(id)
    }
  }, [delay])
}
