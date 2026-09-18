import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  createElement(StrictMode, null, createElement(BrowserRouter, null, createElement(App))),
);
