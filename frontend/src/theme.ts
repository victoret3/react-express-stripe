import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: "'Arial Black', sans-serif", // Para encabezados
    body: "'Arial', sans-serif",          // Para texto general
  },
  styles: {
    global: {
      '@font-face': {
        fontFamily: 'Rock Salt',
        src: "url('/fonts/RockSalt-Regular.woff2') format('woff2')",
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
      // Fix horizontal overflow
      'html, body': {
        overflowX: 'hidden',
        maxWidth: '100%',
      },
      '#root': {
        overflowX: 'hidden',
        maxWidth: '100%',
      },
      // Ensure all elements use border-box
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
    },
  },
  colors: {
    brand: {
      primary: '#EB6953',   // Rojo coral
      secondary: '#F3EEE6', // Beige claro
      accent1: '#93E3FE',   // Azul cielo
      accent2: '#DFDB44',   // Amarillo dorado
      accent3: '#04A0D4',   // Azul vibrante
      accent4: '#FFC47E',   // Naranja claro
    },
  },
});

export default theme;
