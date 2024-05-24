import * as Sentry from '@sentry/react'

import { siteMetadata } from './gatsby-config'

const { sentryDSN } = siteMetadata
export const onClientEntry = () => {
  if (sentryDSN) {
    Sentry.init({
      dsn: sentryDSN,
      beforeSend(event, { originalException: error }) {
        if (error && error.message) {
          // this error happens when ResizeObserver not able to deliver all observations within a single animation frame
          if (error.message.match(/ResizeObserver loop limit exceeded/i)) {
            return null
          }
          // extension errors
          if (error.message.match(/extension context/i)) {
            return null
          }
        }
        return event
      },
      denyUrls: [
        // Chrome extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
      ],
    })
    window.Sentry = Sentry
  }
}
