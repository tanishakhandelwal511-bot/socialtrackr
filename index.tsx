import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * SOCIAL TRACKR - APP BOOTSTRAP
 * Ensuring single React instance execution via the unified import map.
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
  }
}