import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Bot, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { navTrail } from '../../app/navigation.js';
import { useT } from '../../i18n/index.jsx';
import { useSession } from '../../app/SessionProvider.jsx';

/**
 * Address bar (desktop, like Windows Explorer): Back · Forward · Up + the location path.
 * Path = module › section from navigation.js, plus the crumbs the current page declares
 * through <PageShell breadcrumbs> (record names, "New task"…). Phones keep the page's own Back.
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
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const { crumbs } = useContext(CrumbsContext);
  const { assistantEnabled, access } = useSession();
  const showAssistant = assistantEnabled && access('ai') !== 'none' && !location.pathname.startsWith('/ai/assistant');

  // History position (react-router keeps `idx` in history.state). Forward = entries after it.
  const idx = window.history.state?.idx;
  const maxIdx = useRef(idx ?? 0);
  const seenKey = useRef(null);
  if (seenKey.current !== location.key) {
    seenKey.current = location.key;
    if (idx != null) maxIdx.current = navType === 'PUSH' ? idx : Math.max(maxIdx.current, idx);
  }
  const canBack = idx == null || idx > 0;
  const canForward = idx == null || idx < maxIdx.current;

  // The quick forms record where they were opened from: their path starts there.
  const base = navTrail(location.state?.from || location.pathname).map((c) => ({ label: t(c.labelKey), to: c.to }));
  const extra = (crumbs || []).filter((c) => !base.some((b) => b.label === c.label));
  const trail = [...base, ...extra];
  if (!trail.length) trail.push({ label: t('nav.dashboard'), to: '/' });
  const parent = [...trail].reverse().find((c, i) => i > 0 && c.to && c.to !== location.pathname);

  return (
    <nav className="addressbar" aria-label={t('address.label')}>
      <div className="addressbar__buttons">
        <button type="button" className="addressbar__btn" onClick={() => navigate(-1)} disabled={!canBack} aria-label={t('address.back')} title={`${t('address.back')} (Alt+←)`}><ArrowLeft aria-hidden="true" /></button>
        <button type="button" className="addressbar__btn" onClick={() => navigate(1)} disabled={!canForward} aria-label={t('address.forward')} title={`${t('address.forward')} (Alt+→)`}><ArrowRight aria-hidden="true" /></button>
        <button type="button" className="addressbar__btn" onClick={() => parent && navigate(parent.to)} disabled={!parent} aria-label={t('address.up')} title={t('address.up')}><ArrowUp aria-hidden="true" /></button>
      </div>
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
      {showAssistant && (
        <button type="button" className="addressbar__assistant" onClick={() => window.dispatchEvent(new Event('assistant:open'))}>
          <Bot aria-hidden="true" />{t('ai.nav.assistant')}
        </button>
      )}
    </nav>
  );
}
