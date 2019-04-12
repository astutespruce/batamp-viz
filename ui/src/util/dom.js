export const hasWindow = typeof window !== 'undefined' && window

export const isUnsupported =
  /MSIE 9/i.test(navigator.userAgent) ||
  /MSIE 10/i.test(navigator.userAgent) ||
  /Trident/i.test(navigator.userAgent)
