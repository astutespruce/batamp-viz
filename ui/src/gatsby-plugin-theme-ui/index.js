export default {
  useColorSchemeMediaQuery: false,
  useLocalStorage: false,
  breakpoints: ['40em', '52em', '64em'],
  // generated using: https://palx.jxnblk.com/004d84
  colors: {
    white: '#FFF',
    black: '#000',
    link: '#0f6bbc',
    text: '#333',
    primary: {
      1: '#e6edf3',
      2: '#cbdae5',
      3: '#abc4d6',
      4: '#85aac4',
      5: '#5487ac',
      6: '#004d84',
      7: '#004576',
      8: '#004274',
      9: '#002138',
    },
    secondary: {
      1: '#f4e9ea',
      2: '#e9d2d4',
      3: '#dcb6b9',
      4: '#cb9499',
      5: '#b5676d',
      6: '#84000b',
      7: '#770009',
      8: '#550007',
      9: '#3c0005',
    },
    highlight: {
      1: '#eeeaf4', // lightest violet
      5: '#ee7a14', // orange
      6: '#bc600f',
    },
    grey: {
      1: '#f9f9f9',
      2: '#ededee',
      3: '#e1e0e2',
      4: '#d3d2d5',
      5: '#c5c2c7',
      6: '#b4b1b8',
      7: '#a19ea6',
      8: '#6f6976',
      9: '#433c4c',
    },
  },
  fonts: {
    body: 'Lato,sans-serif',
    heading: 'Lato,sans-serif',
  },
  fontSizes: [12, 14, 16, 18, 24, 32, 48, 64, 72, 112],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
  },
  lineHeights: {
    body: 1.4,
    heading: 1.2,
  },
  layout: {
    container: {
      px: ['1rem', '1rem', '0px'],
      mt: '2rem',
      mb: '4rem',
    },
  },
  sizes: {
    container: '960px',
  },
  buttons: {
    'toggle-active': {
      flex: '1 1 auto',
      cursor: 'pointer',
      color: '#FFF',
      bg: 'primary.8',
      '&:hover': {
        bg: 'primary.7',
      },
    },
    'toggle-inactive': {
      flex: '1 1 auto',
      cursor: 'pointer',
      color: '#FFF',
      bg: 'grey.8',
      '&:hover': {
        bg: 'grey.9',
      },
    },
  },
  text: {
    default: {
      display: 'block', // fix for theme-ui v6 (div => span)
    },
    help: {
      display: 'block',
      color: 'grey.8',
      fontSize: 1,
    },
    heading: {
      fontFamily: 'heading',
      fontWeight: 'heading',
      lineHeight: 'heading',
      section: {
        fontSize: ['1.5rem', '2rem'],
        mb: '1.5rem',
      },
    },
    paragraph: {
      fontSize: '1.25rem',
      color: 'grey.9',
      lineHeight: 1.6,
    },
  },
  styles: {
    root: {
      height: '100vh',
      overflowX: 'hidden',
      overflowY: 'hidden',
      margin: 0,
      body: {
        margin: 0,
        height: '100%',
        width: '100%',
      },
      '#___gatsby': {
        height: '100%',
      },
      '#___gatsby > *': {
        height: '100%',
      },
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      h1: {
        variant: 'text.heading',
        fontSize: [5, 6],
      },
      h2: {
        variant: 'text.heading',
        fontSize: [4, 5],
      },
      h3: {
        variant: 'text.heading',
        fontSize: [3, 4],
      },
      h4: {
        variant: 'text.heading',
        fontSize: [2, 3],
      },
      a: {
        color: 'link',
        textDecoration: 'none',
      },
      'a:hover': {
        textDecoration: 'underline',
      },
      ul: {
        pl: '1.5rem',
        'li+li': {
          mt: '1rem',
        },
      },
    },
  },
}
