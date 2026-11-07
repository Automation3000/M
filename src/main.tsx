// Ensure window.fetch has both getter and setter so browser extensions / injected executors
// cannot fail on assigning window.fetch
try {
  const _orig = typeof window.fetch === 'function' ? window.fetch.bind(window) : window.fetch;
  let _current = _orig;
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    get() {
      return _current;
    },
    set(fn) {
      _current = fn;
    },
  });
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
