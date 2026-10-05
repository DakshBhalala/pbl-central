import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';

// Purge legacy dark theme state from browser storage
try {
  localStorage.removeItem('pbl_theme');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
} catch {
  // Storage unavailable
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
