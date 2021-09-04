import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { getKeplrAccountProvider, gripApp } from '@stakeordie/griptape.js'
import App from './App';
import SwapProvider from './context';

//Griptape set up
const restUrl = 'https://api.holodeck.stakeordie.com';
const provider = getKeplrAccountProvider();

gripApp(restUrl,provider,()=>
  ReactDOM.render(
    <React.StrictMode>
      <SwapProvider>
        <App />
      </SwapProvider>
    </React.StrictMode>,
    document.getElementById('root')
  )
);

