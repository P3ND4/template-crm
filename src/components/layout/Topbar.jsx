import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, Bot, Building2, CalendarPlus, CheckSquare, ChevronDown, ChevronUp, Download, Eye, FileText,
  Bell, Languages, LogOut, Mail, Receipt, Search, ShoppingCart, SlidersHorizontal, StickyNote, User, UserPlus, WifiOff,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';
import Avatar from '../ui/Avatar.jsx';
import Menu from '../ui/Menu.jsx';
import { NAV, NAV_FOOTER, navTrail } from '../../app/navigation.js';
import { useSession } from '../../app/SessionProvider.jsx';
import { SETTINGS_META } from '../../services/index.js';
import { usePwa } from '../../app/pwa.js';
import cx from '../../lib/cx.js';
import { useRibbonState } from './Ribbon.jsx';

const MODULES = [...NAV, ...NAV_FOOTER];
const COLLAPSE_KEY = 'app.ribbonCollapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

/** The module that owns the current URL (Dashboard only matches "/"). Quick forms belong to where they were opened. */
export function useActiveModule() {
  const { pathname, state } = useLocation();
  const path = (pathname.startsWith('/new/') || pathname.startsWith('/edit/')) && state?.from ? state.from.split('?')[0] : pathname;
  return MODULES.find((m) => (m.end ? path === m.to : path === m.to || path.startsWith(`${m.to}/`))) || null;
}

/** Back / Forward / Up state, like Windows Explorer (react-router keeps `idx` in history.state). */
function useHistoryNav() {
  const location = useLocation();
  const navType = useNavigationType();
  const idx = window.history.state?.idx;
  const maxIdx = useRef(idx ?? 0);
  const seenKey = useRef(null);
  if (seenKey.current !== location.key) {
    seenKey.current = location.key;
    if (idx != null) maxIdx.current = navType === 'PUSH' ? idx : Math.max(maxIdx.current, idx);
  }
  const trail = navTrail(location.state?.from || location.pathname);
  const up = [...trail].reverse().find((c) => c.to && c.to !== location.pathname) || (location.pathname !== '/' ? { to: '/' } : null);
  return { canBack: idx == null || idx > 0, canForward: idx == null || idx < maxIdx.current, up: up?.to };
}

/** "New" entries of each module's ribbon. */
function useNewItems(moduleId) {
  const { t } = useI18n();
  const quick = useQuickActions();
  const navigate = useNavigate();
  const q = (type, label, icon) => ({ id: `new-${type}`, label, icon, onClick: () => quick.open(type) });
  const go = (to, label, icon) => ({ id: `new-${to}`, label, icon, onClick: () => navigate(to) });
  switch (moduleId) {
    case 'dashboard': return [q('task', t('quick.task'), CheckSquare), q('appointment', t('quick.appointment'), CalendarPlus), q('note', t('quick.note'), StickyNote)];
    case 'crm': return [go('/crm/leads/new', t('quick.lead'), UserPlus), q('contact', t('ribbon.context.contact'), User), q('appointment', t('quick.appointment'), CalendarPlus), q('task', t('quick.task'), CheckSquare), go('/crm/communications/email/compose', t('channels.email'), Mail)];
    case 'projects': return [go('/projects/new', t('quick.project'), Building2), q('task', t('quick.task'), CheckSquare), q('appointment', t('quick.appointment'), CalendarPlus)];
    case 'finance': return [go('/finance/estimates/new', t('quick.estimate'), FileText), go('/finance/invoices/new', t('quick.invoice'), Receipt), q('expense', t('expenses.new'), ShoppingCart)];
    case 'ai': return [{ id: 'new-ask', label: t('ai.nav.assistant'), icon: Bot, onClick: () => window.dispatchEvent(new Event('assistant:open')) }];
    default: return [];
  }
}

/**
 * Header (top navigation, no sidebar):
 *   1. Title bar — Back · Forward · Up, brand, search, assistant, notifications, user.
 *   2. Module tabs — Dashboard · CRM · Projects · Finance · AI · Settings (+ contextual tab on a record).
 *   3. Ribbon (one line, can be collapsed) — Go to (sections) · New · page controls, or the record's actions.
 * Its measured height is --topbar-h (used by fixed/sticky elements and fill pages).
 */
export default function Topbar({ onOpenSearch, unread = [], counts = {}, collapsed, onToggleCollapse }) {
  const { t, locale, setLocale } = useI18n();
  const { user: me, role, realRole, setViewAs, signOut, assistantEnabled, access } = useSession();
  const pwa = usePwa();
  const navigate = useNavigate();
  const location = useLocation();
  const active = useActiveModule();
  const hist = useHistoryNav();
  const ribbon = useRibbonState();
  const newItems = useNewItems(active?.id);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const showAssistant = assistantEnabled && access('ai') !== 'none' && !location.pathname.startsWith('/ai/assistant');

  // Which ribbon is showing: the record's contextual tab (default when there is one) or the module's.
  const [view, setView] = useState('module');
  useEffect(() => { setView(ribbon.contextLabel ? 'context' : 'module'); }, [ribbon.contextLabel, location.pathname]);
  const showContext = Boolean(ribbon.contextLabel) && view === 'context';

  // Keep the current tab visible when the tab row scrolls sideways (phones).
  const tabsRef = useRef(null);
  useEffect(() => {
    const row = tabsRef.current;
    const el = row?.querySelector('.modtab.is-current') || row?.querySelector('.modtab.is-module');
    if (!row || !el || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2;
  }, [location.pathname, showContext, ribbon.contextLabel]);

  const onTab = (e, m) => {
    // The current module's tab doesn't navigate (like Office): it shows its ribbon (and opens it if collapsed).
    if (active?.id === m.id) {
      e.preventDefault();
      if (collapsed) onToggleCollapse();
      setView('module');
    }
  };

  return (
    <header className="topbar">
      <div className="titlebar">
        <div className="titlebar__history" role="group" aria-label={t('address.label')}>
          <button type="button" className="tb-btn" onClick={() => navigate(-1)} disabled={!hist.canBack} aria-label={t('address.back')} title={`${t('address.back')} (Alt+←)`}><ArrowLeft aria-hidden="true" /></button>
          <button type="button" className="tb-btn hide-mobile" onClick={() => navigate(1)} disabled={!hist.canForward} aria-label={t('address.forward')} title={`${t('address.forward')} (Alt+→)`}><ArrowRight aria-hidden="true" /></button>
          <button type="button" className="tb-btn hide-mobile" onClick={() => hist.up && navigate(hist.up)} disabled={!hist.up} aria-label={t('address.up')} title={t('address.up')}><ArrowUp aria-hidden="true" /></button>
        </div>
        <Link to="/" className="titlebar__brand" aria-label="Template CRM — Dashboard">Template<span>.</span><small>CRM</small></Link>
        <button type="button" className="search-trigger" onClick={onOpenSearch} aria-label={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`} title={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`}>
          <Search aria-hidden="true" />
          <span className="label">{t('topbar.searchShort')}</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <div className="titlebar__actions">
          {!pwa.online && <span className="offline-pill" role="status" title={t('pwa.offlineHint')}><WifiOff aria-hidden="true" /><span className="hide-mobile">{t('pwa.offline')}</span><span className="sr-only">{t('pwa.offlineHint')}</span></span>}
          {showAssistant && (
            <button type="button" className="tb-btn tb-btn--label tb-assistant" onClick={() => window.dispatchEvent(new Event('assistant:open'))}>
              <Bot aria-hidden="true" /><span>{t('ai.nav.assistant')}</span>
            </button>
          )}
          <Menu
            label={t('topbar.notifications')}
            trigger={(p) => (
              <button type="button" className="tb-btn" aria-label={t('topbar.notifications')} {...p}>
                <Bell aria-hidden="true" />{unread.length > 0 && <span className="tb-btn__dot" aria-hidden="true" />}
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="menu__label">{t('topbar.notifications')}</div>
                {unread.length === 0 && <p className="menu__item muted">{t('topbar.noNotifications')}</p>}
                {unread.slice(0, 5).map((n) => (
                  <Link key={n.id} role="menuitem" className="menu__item" to={`/crm/communications/${n.channel}?c=${n.id}`} onClick={close}>
                    <Avatar name={n.contactName} size="sm" title="" />
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{n.contactName}</span>
                      <span className="truncate muted" style={{ display: 'block', fontSize: 12 }}>{n.lastMessage}</span>
                    </span>
                  </Link>
                ))}
              </>
            )}
          </Menu>
          <Menu
            label={t('topbar.userMenu')}
            trigger={(p) => (
              <button type="button" className="user-btn" aria-label={t('topbar.userMenu')} {...p}>
                <Avatar name={me?.name} title="" />
                <ChevronDown size={14} className="hide-mobile" aria-hidden="true" />
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="menu__label">{me?.name} · {me?.title}</div>
                <div className="menu__label" style={{ paddingTop: 0 }}>{t('app.org')} · {t('app.demoData')}</div>
                <Link role="menuitem" className="menu__item" to="/settings/profile" onClick={close}><User />{t('topbar.profile')}</Link>
                <Link role="menuitem" className="menu__item" to="/settings/organization" onClick={close}><SlidersHorizontal />{t('topbar.preferences')}</Link>
                {!pwa.installed && (pwa.canInstall
                  ? <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); pwa.install(); }}><Download />{t('pwa.install')}</button>
                  : <Link role="menuitem" className="menu__item" to="/settings/profile#device" onClick={close}><Download />{t('pwa.install')}</Link>)}
                <button role="menuitem" type="button" className="menu__item" onClick={() => { setLocale(locale === 'en' ? 'es' : 'en'); close(); }}>
                  <Languages />{locale === 'en' ? 'Español' : 'English'}
                </button>
                <div className="menu__sep" />
                <div className="menu__label">{t('settings.viewAs.menu')}</div>
                {SETTINGS_META.roles.map((r) => (
                  <button key={r} role="menuitemradio" aria-checked={role === r} type="button" className="menu__item" onClick={() => { setViewAs(r); close(); }}>
                    <Eye aria-hidden="true" style={{ opacity: role === r ? 1 : 0 }} />
                    {t(`roles.${r}`)}{r === realRole && <span className="subtle" style={{ marginLeft: 'auto', fontSize: 12 }}>{t('settings.viewAs.you')}</span>}
                  </button>
                ))}
                <div className="menu__sep" />
                <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); signOut(); }}><LogOut />{t('topbar.signOut')}</button>
              </>
            )}
          </Menu>
        </div>
      </div>

      <div className="modtabs">
        <nav className="modtabs__list" ref={tabsRef} aria-label={t('nav.modules')}>
          {MODULES.map((m) => {
            const isActive = active?.id === m.id;
            const current = isActive && !showContext;
            return (
              <NavLink
                key={m.id}
                to={m.to}
                end={m.end}
                className={cx('modtab', current && 'is-current', isActive && 'is-module')}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => onTab(e, m)}
              >
                {t(m.labelKey)}
                {m.badge === 'unread' && counts.unread > 0 && <span className="modtab__badge">{counts.unread}</span>}
              </NavLink>
            );
          })}
          {ribbon.contextLabel && (
            <button type="button" className={cx('modtab modtab--context', showContext && 'is-current')} aria-pressed={showContext} onClick={() => { if (collapsed) onToggleCollapse(); setView('context'); }}>
              {ribbon.contextLabel}
            </button>
          )}
        </nav>
        <button type="button" className="modtabs__pin" onClick={onToggleCollapse} aria-expanded={!collapsed} aria-label={collapsed ? t('ribbon.expand') : t('ribbon.collapse')} title={`${collapsed ? t('ribbon.expand') : t('ribbon.collapse')} (Ctrl/⌘ + B)`}>
          {collapsed ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
        </button>
      </div>

      {!collapsed && (
        <div className="ribbon" role="toolbar" aria-label={showContext ? ribbon.contextLabel : t('ribbon.label', { module: active ? t(active.labelKey) : '' })}>
          {showContext ? (
            <div className="ribbon__slot" ref={ribbon.setContextSlot} />
          ) : (
            <>
              {active?.children && (
                <div className="ribbon__group" role="group" aria-label={t('ribbon.goto')}>
                  {active.children.map((c) => {
                    const Icon = c.icon;
                    return (
                      <NavLink key={c.id} to={c.to} end={c.end} className="rbtn">
                        <Icon aria-hidden="true" />{t(c.labelKey)}
                        {c.badge === 'unread' && counts.unread > 0 && <span className="rbtn__badge">{counts.unread}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              )}
              {newItems.length > 0 && (
                <div className="ribbon__group" role="group" aria-label={t('ribbon.new')}>
                  <span className="ribbon__label" aria-hidden="true">{t('ribbon.new')}</span>
                  {newItems.map((it) => {
                    const Icon = it.icon;
                    return <button key={it.id} type="button" className="rbtn" onClick={it.onClick}><Icon aria-hidden="true" />{it.label}</button>;
                  })}
                </div>
              )}
              <div className="ribbon__page" ref={ribbon.setPageSlot} />
            </>
          )}
        </div>
      )}
      <MeasureHeight />
    </header>
  );
}

/** Keeps --topbar-h equal to the real header height (it changes with the ribbon, safe areas and wrapping). */
function MeasureHeight() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const header = ref.current?.parentElement;
    const app = header?.closest('.app');
    if (!header || !app) return undefined;
    const set = () => app.style.setProperty('--topbar-h', `${header.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(set) : null;
    ro?.observe(header);
    return () => ro?.disconnect();
  }, []);
  return <span ref={ref} hidden />;
}
