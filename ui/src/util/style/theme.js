const breakpoints = ['40em', '52em', '64em']

// generated using: https://palx.jxnblk.com/004d84
const colors = {
  pageBackground: 'hsl(228, 33%, 97%)',
  white: 'hsl(0, 0%, 100%)',
  black: 'hsl(0, 0%, 0%)',
  primary: {
    100: '#e6edf3',
    200: '#cbdae5',
    300: '#abc4d6',
    400: '#85aac4',
    500: '#5487ac',
    600: '#004d84',
    700: '#004576',
    800: '#003053',
    900: '#002138',
  },
  secondary: {
    100: '#f4e9ea',
    200: '#e9d2d4',
    300: '#dcb6b9',
    400: '#cb9499',
    500: '#b5676d',
    600: '#84000b',
    700: '#770009',
    800: '#550007',
    900: '#3c0005',
  },
  grey: {
    100: '#f9f9f9',
    200: '#ededee',
    300: '#e1e0e2',
    400: '#d3d2d5',
    500: '#c5c2c7',
    600: '#b4b1b8',
    700: '#a19ea6',
    800: '#6f6976',
    900: '#433c4c',
  },
}

const space = [0, 4, 8, 16, 32, 64, 128, 256, 512]

const fontSizes = [12, 14, 16, 20, 24, 32, 48, 64, 96, 128]

const lineHeights = [1, 1.125, 1.25, 1.5]

const fontWeights = {
  normal: 400,
  semibold: 600,
}

/**
 * Letter-spacing should vary, depending on usage of text
 */
const letterSpacings = {
  normal: 'normal',
  caps: '0.25em',
  labels: '0.05em',
}

/**
 * Border-radius
 */
const radii = [0, 2, 4, 8, 16]

const buttons = {
  default: {
    backgroundColor: colors.grey[800],
  },
  primary: {
    backgroundColor: colors.primary[700],
  },
  secondary: {
    backgroundColor: colors.primary[500],
  },
  disabled: {
    backgroundColor: colors.grey[300],
  },
}

export const theme = {
  name: 'Default',
  breakpoints,
  colors,
  buttons,
  space,
  fontSizes,
  lineHeights,
  fontWeights,
  letterSpacings,
  radii,
}
