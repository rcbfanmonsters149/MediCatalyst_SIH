import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Prevent the whole website from zooming on trackpad pinch or Ctrl+wheel
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', (e) => {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', (e) => {
  e.preventDefault();
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
