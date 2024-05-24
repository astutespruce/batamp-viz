import { css } from '@emotion/react'
import { withPrefix } from 'gatsby'

const prefix = withPrefix('/fonts')

export const fonts = css`
  @font-face {
    font-family: 'Lato';
    font-style: normal;
    font-display: fallback;
    font-weight: 400;
    src:
      local('Lato Regular'),
      url('${prefix}/Lato-Regular.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Lato';
    font-style: normal;
    font-display: fallback;
    font-weight: 700;
    src:
      local('Lato Bold'),
      url('${prefix}/Lato-Bold.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Lato';
    font-style: italic;
    font-display: fallback;
    font-weight: 400;
    src:
      local('Lato Italic'),
      url('${prefix}/Lato-Italic.woff2') format('woff2');
  }
`
