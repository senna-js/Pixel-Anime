import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ProgressRouter from './components/router/ProgressRouter';
import ScrollToTop from './components/router/ScrollToTop';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <ProgressRouter>
    <App />
      </ProgressRouter>
    </BrowserRouter>
  </React.StrictMode>
);
