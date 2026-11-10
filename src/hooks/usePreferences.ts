import { useEffect, useState } from 'react';

const key = 'livera:round0:preferences';
const defaults = { hideAmounts: false, largeText: false };
export function usePreferences() {
  const [preferences, setPreferences] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '{}');
      return {
        hideAmounts: typeof value.hideAmounts === 'boolean' ? value.hideAmounts : false,
        largeText: typeof value.largeText === 'boolean' ? value.largeText : false,
      };
    } catch { return defaults; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Preferences remain available for this visit. */ }
  }, [preferences]);
  return { preferences, setPreferences, reset: () => setPreferences({ ...defaults }) };
}
