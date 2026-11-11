import { registerServiceWorker } from './pwa.js'; // first: catches the browser's early install offer
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './styles.css';
import './public.css'; // after styles.css: the public website's rules refine the shared ones

registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
