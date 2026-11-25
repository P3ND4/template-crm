import { useEffect, useState } from 'react';

/** true while the media query matches (e.g. PHONE_QUERY). */
export default function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia?.(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;
    const on = () => setMatch(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return Boolean(match);
}

/** Phones: bottom tab bar + one compact navigation row (Topbar.jsx). Keep in sync with layout.css. */
export const PHONE_QUERY = '(max-width: 599px)';
