import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * SOCIAL TRACKR - APP BOOTSTRAP
 * Unified React instance execution.
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
  } catch (err) {
    console.error("❌ [System] Application failed to mount:", err);
    mountNode.innerHTML = `
      <div style="background: #020617; color: #f87171; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; text-align: center; padding: 40px;">
        <div style="max-width: 500px; border: 1px solid rgba(248, 113, 113, 0.2); padding: 40px; border-radius: 24px; background: rgba(15, 23, 42, 0.5);">
          <h1 style="margin-bottom: 16px; font-weight: 900; letter-spacing: -0.02em;">STARTUP ERROR</h1>
          <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">The application encountered a conflict while loading React modules. This usually happens if the environment is unstable or a module is blocked.</p>
          <div style="font-size: 11px; font-family: monospace; background: #000; padding: 15px; border-radius: 12px; color: #64748b; text-align: left; overflow-x: auto;">
            ${err instanceof Error ? err.stack : 'Unknown Module Conflict'}
          </div>
          <button onclick="location.reload()" style="margin-top: 32px; background: #1e293b; border: 1px solid #334155; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
            Retry Connection
          </button>
        </div>
      </div>
    `;
  }
}