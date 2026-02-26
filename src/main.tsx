import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { logger } from './utils/logger'

// Global error handlers for unhandled errors and promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', new Error(event.reason), {
    reason: event.reason,
    promise: event.promise,
  });
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error || new Error(event.message), {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

createRoot(document.getElementById('root')!).render(
  <App />,
)
