// src/index.js (main entry point)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { NhostProvider } from '@nhost/react';
import { ApolloProvider } from '@apollo/client';
import nhost from './nhost.js'
import client from './apolloClient.js';
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <NhostProvider nhost={nhost}>
    <ApolloProvider client={client}>
    <App />
    </ApolloProvider>
  </NhostProvider>
);
