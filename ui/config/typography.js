import Typography from 'typography'
import TypographyTheme from 'typography-theme-noriega'

import { theme } from 'style'

TypographyTheme.overrideThemeStyles = () => ({
  html: {
    'overflow-y': 'hidden !important',
    height: '100%',
  },
  body: {
    height: '100%',
    width: '100%',
  },
  // Set height on containing notes to 100% so that full screen map layouts work
  '#___gatsby': {
    height: '100%',
  },
  '#___gatsby > *': {
    height: '100%',
  },
  'a, a:visited, a:active': {
    textDecoration: 'none',
    color: theme.colors.link,
  },
  button: {
    outline: 'none',
    cursor: 'pointer',
  },
})

const typography = new Typography(TypographyTheme)

export default typography
