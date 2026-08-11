import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically direct relative /api requests on Vercel directly to live Render backend
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  const BACKEND_URL = 'https://royal-cars-rental.onrender.com';

  window.fetch = function (resource, options) {
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      const isVercel = window.location.hostname.includes('vercel.app');
      if (isVercel || import.meta.env.PROD) {
        resource = `${BACKEND_URL}${resource}`;
      }
    }
    return originalFetch.call(this, resource, options);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
