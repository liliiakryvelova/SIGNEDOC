import type { PreviewDataState } from '../types/index.js';

const allowed: PreviewDataState[] = ['data', 'loading', 'empty', 'error'];
export function getPreviewState(): PreviewDataState {
  if (!import.meta.env.DEV) return 'data';
  const query = new URLSearchParams(window.location.search).get('previewState');
  const stored = window.localStorage.getItem('previewState');
  const value = query ?? stored;
  return value && allowed.includes(value as PreviewDataState) ? value as PreviewDataState : 'data';
}

export function setPreviewState(state: PreviewDataState): void {
  window.localStorage.setItem('previewState', state);
  const url = new URL(window.location.href);
  url.searchParams.set('previewState', state);
  window.history.replaceState({}, '', url);
  window.dispatchEvent(new CustomEvent('signedoc-preview-state', { detail: state }));
}