import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: "'Rock Salt', sans-serif", // Usar para encabezados
    body: "'Rock Salt', sans-serif",    // Usar para texto general
  },
  styles: {
    global: {
      '@font-face': {
        fontFamily: 'Rock Salt',
        src: "url('/fonts/RockSalt-Regular.woff2') format('woff2')",
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    },
  },
});

export default theme;
