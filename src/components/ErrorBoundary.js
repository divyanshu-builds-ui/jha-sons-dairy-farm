import React from 'react';
import { Wrench, Check } from 'lucide-react';
import { db, collection, addDoc } from '../services/firebase';

// ROOT level — catches EVERYTHING (Login, providers, etc.)
// If this triggers, the entire app is dead. Shows minimal recovery UI.
export class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    try {
      addDoc(collection(db, 'app_errors'), {
        message: error?.message || 'Root crash',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        user: JSON.parse(localStorage.getItem('lg_user') || '{}')?.phone || 'unknown',
        timestamp: new Date().toISOString(),
        type: 'root_crash',
        severity: 'critical',
      }).catch(() => {});
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>App Crashed</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Something went seriously wrong. Your data is safe — this is a display issue only.</p>
            <button onClick={() => window.location.reload()} style={{ width: '100%', padding: '12px', background: '#1d4ed8', color: '#fff', fontWeight: '700', fontSize: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px' }}>Reload App</button>
            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{ width: '100%', padding: '12px', background: '#f3f4f6', color: '#4b5563', fontWeight: '700', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer' }}>Clear Data & Restart</button>
            <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '16px' }}>Error logged automatically</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to Firebase
    try {
      addDoc(collection(db, 'app_errors'), {
        message: error?.message || 'Unknown error',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        user: JSON.parse(localStorage.getItem('lg_user') || '{}')?.phone || 'unknown',
        timestamp: new Date().toISOString(),
        type: 'crash',
        severity: 'high',
        context: 'ErrorBoundary',
      }).catch(() => {});
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      const isDev = user.phone === '8051725780';

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>

            <h1 className="text-xl font-black text-gray-800 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The app encountered an unexpected error. Don't worry — your data is safe.
            </p>

            {/* Error details only for developer */}
            {isDev && (
            <details className="text-left bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl p-4 mb-4">
              <summary className="text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-[10px] text-red-600 dark:text-red-400 overflow-auto max-h-[120px] whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </pre>
              <p className="mt-1 text-[9px] text-gray-400 break-all">{window.location.href}</p>
            </details>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => window.location.reload()}
                className="w-full py-3 bg-royal-700 text-white font-bold text-sm rounded-xl shadow-md">
                Reload App
              </button>

              <button onClick={() => { window.location.href = '/'; }}
                className="w-full py-3 bg-gray-100 dark:bg-[#111111] text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl border border-gray-200 dark:border-[#222222]">
                Go to Home
              </button>

              {isDev && (
                <button onClick={() => { window.location.href = '/dev'; }}
                  className="w-full py-3 bg-green-600 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5">
                  <Wrench size={14} className="inline" /> Open Dev Console
                </button>
              )}
            </div>

            {/* Logged indicator */}
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-4 flex items-center justify-center gap-1">
              <Check size={12} className="inline" /> Error has been logged automatically
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate boundary for Dev Console — minimal, won't affect main app
export class DevErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    try {
      addDoc(collection(db, 'app_errors'), {
        message: error?.message || 'Dev console crash',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        user: '8051725780',
        timestamp: new Date().toISOString(),
        type: 'dev_crash',
        severity: 'medium',
        context: 'DevErrorBoundary',
      }).catch(() => {});
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h1 className="text-lg font-black text-white mb-2">Dev Console Crashed</h1>
            <pre className="text-[10px] text-red-400 bg-gray-800 rounded-lg p-3 mb-4 overflow-auto max-h-[100px] text-left">
              {this.state.error?.message}
            </pre>
            <button onClick={() => window.location.reload()}
              className="w-full py-3 bg-green-600 text-white font-bold text-sm rounded-xl">
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
