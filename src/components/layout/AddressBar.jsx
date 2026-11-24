import { createContext, useContext, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { navTrail } from '../../app/navigation.js';
import { useT } from '../../i18n/index.jsx';

/**
 * Location path under the ribbon: module › section › record (like the Explorer address bar).
 * Back / Forward / Up live in the title bar (Topbar.jsx). Pages add crumbs through <PageShell breadcrumbs>.
 */
const CrumbsContext = createContext({ crumbs: null, setCrumbs: () => {} });

export function CrumbsProvider({ children }) {
  const [crumbs, setCrumbs] = useState(null);
  return <CrumbsContext.Provider value={{ crumbs, setCrumbs }}>{children}</CrumbsContext.Provider>;
}

/** Pages call this (PageShell does it for them) to add their own crumbs to the address bar. */
export function usePageCrumbs(breadcrumbs) {
  const { setCrumbs } = useContext(CrumbsContext);
  const key = JSON.stringify(breadcrumbs || []);
  useEffect(() => {
    setCrumbs(JSON.parse(key));
    return () => setCrumbs(null);
  }, [key, setCrumbs]);
}

export default function AddressBar() {
  const t = useT();
  const location = useLocation();
  const { crumbs } = useContext(CrumbsContext);
  // The quick forms record where they were opened from: their path starts there.
  const base = navTrail(location.state?.from || location.pathname).map((c) => ({ label: t(c.labelKey), to: c.to }));
  const extra = (crumbs || []).filter((c) => !base.some((b) => b.label === c.label));
  const trail = [...base, ...extra];
  if (!trail.length) trail.push({ label: t('nav.dashboard'), to: '/' });

  return (
    <nav className="addressbar" aria-label={t('address.label')}>
      <ol className="addressbar__path">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${c.label}-${i}`}>
              {c.to && !last ? <Link to={c.to}>{c.label}</Link> : <span aria-current={last ? 'page' : undefined}>{c.label}</span>}
              {!last && <ChevronRight aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
