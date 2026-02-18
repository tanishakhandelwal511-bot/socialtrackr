import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * SOCIAL TRACKR - APP BOOTSTRAP
 * Ensuring single React instance execution via the unified Vite build.
 */

console.log("🚀 [System] Social Trackr is initializing...");

const mountNode = document.getElementById('root');

if (!mountNode) {
  console.error("❌ [System] Critical Failure: #root element missing from DOM.");
} else {
  try {
    const root = createRoot(mountNode);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ [System] Application mounted successfully.");
  } catch (error) {
    console.error("❌ [System] Error during React render:", error);
    mountNode.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">
      <h1 style="color: #ef4444;">Mounting Error</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>`;
  }
}