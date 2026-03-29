import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import App from './App';

const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: 'Aptos, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  defaultRadius: 'lg',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
