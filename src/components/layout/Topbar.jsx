import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, Bot, Building2, CalendarPlus, CheckSquare, ChevronDown, ChevronUp, Download, Eye, FileText,
  Bell, Check, Languages, LogOut, Mail, MoreHorizontal, Plus, Receipt, Search, ShoppingCart, SlidersHorizontal, StickyNote, User, UserPlus, WifiOff,
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
import { BRAND } from '../../app/brand.js';
import { OverflowClone, usePriorityPlus } from './Overflow.jsx';
import useMediaQuery, { PHONE_QUERY } from '../../hooks/useMediaQuery.js';

const MODULES = [...NAV, ...NAV_FOOTER];
/** Ribbon "units" that can move into «More ▾» (each button, link or small menu; group labels stay). */
const RIBBON_UNITS = '.ribbon__group > :not(.ribbon__label), .ribbon__page > :not(.ribbon__group), .ribbon__slot > :not(.ribbon__group)';

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

  // Rows show what fits; the rest goes to «More ▾» (Overflow.jsx). Phones use PhoneNavRow + BottomBar instead.
  const phone = useMediaQuery(PHONE_QUERY);
  const tabsBox = useRef(null);
  const tabsTrack = useRef(null);
  const ribbonBox = useRef(null);
  const ribbonTrack = useRef(null);
  const hiddenTabs = usePriorityPlus(tabsBox, tabsTrack, { units: '.modtab', pinned: '.is-module, .modtab--context', enabled: !phone });
  const hiddenRibbon = usePriorityPlus(ribbonBox, ribbonTrack, { units: RIBBON_UNITS, pinned: '.active, [aria-current="page"]', compactAttr: 'data-compact', enabled: !phone && !collapsed });

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
        <Link to="/" className="titlebar__brand" aria-label={`${BRAND} — Dashboard`}>{BRAND}<span>.</span></Link>
        <button type="button" className="search-trigger" onClick={onOpenSearch} aria-label={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`} title={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`}>
          <Search aria-hidden="true" />
          <span className="label">{t('topbar.searchShort')}</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <div className="titlebar__actions">
          {!pwa.online && <span className="offline-pill" role="status" title={t('pwa.offlineHint')}><WifiOff aria-hidden="true" /><span className="hide-mobile">{t('pwa.offline')}</span><span className="sr-only">{t('pwa.offlineHint')}</span></span>}
          {showAssistant && !phone && (
            <button type="button" className="tb-btn tb-btn--label tb-assistant" onClick={() => window.dispatchEvent(new Event('assistant:open'))}>
              <Bot aria-hidden="true" /><span>{t('ai.nav.assistant')}</span>
            </button>
          )}
          {/* Phones: the assistant lives here (no floating button over the bottom bar and the composers). */}
          {showAssistant && phone && (
            <button type="button" className="tb-btn tb-btn--ai" onClick={() => window.dispatchEvent(new Event('assistant:open'))} aria-label={t('ai.assistant.open')} title={t('ai.assistant.open')}>
              <Bot aria-hidden="true" />
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

      {phone ? (
        <PhoneNavRow active={active} newItems={newItems} />
      ) : (
        <>
          <div className="modtabs" ref={tabsBox}>
            <nav className="modtabs__track" ref={tabsTrack} aria-label={t('nav.modules')}>
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
            <Menu
              className="modtabs__more"
              label={t('nav.moreModules')}
              trigger={(p) => <button type="button" className="modtab modtab--more" {...p}>{t('nav.more')}<ChevronDown aria-hidden="true" /></button>}
            >
              {(close) => MODULES.filter((m, i) => hiddenTabs.includes(i)).map((m) => {
                const Icon = m.icon;
                return (
                  <NavLink key={m.id} role="menuitem" className="menu__item" to={m.to} end={m.end} onClick={close}>
                    <Icon aria-hidden="true" />{t(m.labelKey)}
                    {m.badge === 'unread' && counts.unread > 0 && <span className="modtab__badge" style={{ marginLeft: 'auto' }}>{counts.unread}</span>}
                  </NavLink>
                );
              })}
            </Menu>
            <button type="button" className="modtabs__pin" onClick={onToggleCollapse} aria-expanded={!collapsed} aria-label={collapsed ? t('ribbon.expand') : t('ribbon.collapse')} title={`${collapsed ? t('ribbon.expand') : t('ribbon.collapse')} (Ctrl/⌘ + B)`}>
              {collapsed ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
            </button>
          </div>

          {!collapsed && (
            <div className="ribbon" ref={ribbonBox} role="toolbar" aria-label={showContext ? ribbon.contextLabel : t('ribbon.label', { module: active ? t(active.labelKey) : '' })}>
              <div className="ribbon__track" ref={ribbonTrack}>
                <RibbonContent showContext={showContext} active={active} newItems={newItems} counts={counts} t={t} slots={{ context: ribbon.setContextSlot, page: ribbon.setPageSlot }} />
              </div>
              <Menu
                className="ribbon__more"
                label={t('ribbon.more')}
                panelClassName="ribbon-menu"
                trigger={(p) => <button type="button" className="rbtn" {...p}>{t('ribbon.more')}<ChevronDown aria-hidden="true" /></button>}
              >
                {(close) => (
                  <OverflowClone hidden={hiddenRibbon} units={RIBBON_UNITS} onPick={close}>
                    <RibbonContent showContext={showContext} active={active} newItems={newItems} counts={counts} t={t} slots={{ context: ribbon.setContextCloneSlot, page: ribbon.setPageCloneSlot }} />
                  </OverflowClone>
                )}
              </Menu>
              {!showContext && newItems.length > 0 && (
                <Menu
                  className="ribbon__new"
                  label={t('ribbon.new')}
                  trigger={(p) => <button type="button" className="rbtn rbtn--primary" {...p}><Plus aria-hidden="true" />{t('ribbon.new')}<ChevronDown aria-hidden="true" /></button>}
                >
                  {(close) => newItems.map((it) => {
                    const Icon = it.icon;
                    return <button key={it.id} role="menuitem" type="button" className="menu__item" onClick={() => { close(); it.onClick(); }}><Icon aria-hidden="true" />{it.label}</button>;
                  })}
                </Menu>
              )}
            </div>
          )}
        </>
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

/** The ribbon's content: module view (Go to · New · page controls) or the record's contextual actions. Rendered
 * twice on wide screens — in the ribbon and inside «More ▾» — with different portal slots. */
function RibbonContent({ showContext, active, newItems, counts, t, slots }) {
  if (showContext) return <div className="ribbon__slot" ref={slots.context} />;
  return (
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
        <div className="ribbon__group ribbon__group--new" role="group" aria-label={t('ribbon.new')}>
          <span className="ribbon__label" aria-hidden="true">{t('ribbon.new')}</span>
          {newItems.map((it) => {
            const Icon = it.icon;
            return <button key={it.id} type="button" className="rbtn" onClick={it.onClick}><Icon aria-hidden="true" />{it.label}</button>;
          })}
        </div>
      )}
      <div className="ribbon__page" ref={slots.page} />
    </>
  );
}

/** Section of the current module that owns the URL (Leads, Agenda…). */
function useActiveSection(active) {
  const { pathname, state } = useLocation();
  const path = (pathname.startsWith('/new/') || pathname.startsWith('/edit/')) && state?.from ? state.from.split('?')[0] : pathname;
  return (active?.children || []).find((c) => (c.end ? path === c.to : path === c.to || path.startsWith(`${c.to}/`))) || null;
}

/**
 * Phones: one row under the title bar — section ▾ (sections of the current module) · + (New) · ⋯ (the page's
 * controls or the record's actions). Modules live in the bottom bar (BottomBar).
 */
function PhoneNavRow({ active, newItems }) {
  const { t } = useI18n();
  const ribbon = useRibbonState();
  const section = useActiveSection(active);
  const children = active?.children || [];
  const title = section ? t(section.labelKey) : active ? t(active.labelKey) : t('nav.dashboard');
  const TitleIcon = section?.icon || active?.icon;
  const actionsLabel = ribbon.contextLabel || t('ribbon.pageActions');
  const hasActions = Boolean(ribbon.contextLabel) || ribbon.pageControls > 0;
  return (
    <nav className="phonenav" aria-label={t('nav.sections')}>
      {children.length > 0 ? (
        <Menu
          align="left"
          className="phonenav__section"
          label={t('nav.submodules', { name: t(active.labelKey) })}
          trigger={(p) => (
            <button type="button" className="phonenav__title" {...p}>
              {TitleIcon && <TitleIcon aria-hidden="true" />}<span className="truncate">{title}</span><ChevronDown className="phonenav__chev" aria-hidden="true" />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="menu__label">{t(active.labelKey)}</div>
              {children.map((c) => {
                const Icon = c.icon;
                const current = c.id === section?.id;
                return (
                  <NavLink key={c.id} role="menuitem" to={c.to} end={c.end} onClick={close} className={cx('menu__item', current && 'is-current')} aria-current={current ? 'page' : undefined}>
                    <Icon aria-hidden="true" />{t(c.labelKey)}
                    {current && <Check className="menu__check" aria-hidden="true" />}
                  </NavLink>
                );
              })}
            </>
          )}
        </Menu>
      ) : (
        <span className="phonenav__title phonenav__title--static">{TitleIcon && <TitleIcon aria-hidden="true" />}<span className="truncate">{title}</span></span>
      )}
      <span className="grow" />
      {newItems.length > 0 && (
        <Menu
          label={t('ribbon.new')}
          trigger={(p) => <button type="button" className="phonenav__btn phonenav__btn--primary" aria-label={t('ribbon.new')} title={t('ribbon.new')} {...p}><Plus aria-hidden="true" /></button>}
        >
          {(close) => (
            <>
              <div className="menu__label">{t('ribbon.new')}</div>
              {newItems.map((it) => {
                const Icon = it.icon;
                return <button key={it.id} role="menuitem" type="button" className="menu__item" onClick={() => { close(); it.onClick(); }}><Icon aria-hidden="true" />{it.label}</button>;
              })}
            </>
          )}
        </Menu>
      )}
      {hasActions && (
        <Menu
          label={actionsLabel}
          panelClassName="ribbon-menu"
          trigger={(p) => <button type="button" className="phonenav__btn" aria-label={actionsLabel} title={actionsLabel} {...p}><MoreHorizontal aria-hidden="true" /></button>}
        >
          {(close) => (
            <OverflowClone hidden={null} units={RIBBON_UNITS} onPick={close}>
              <div className="menu__label">{actionsLabel}</div>
              {ribbon.contextLabel
                ? <div className="ribbon__slot" ref={ribbon.setContextCloneSlot} />
                : <div className="ribbon__page" ref={ribbon.setPageCloneSlot} />}
            </OverflowClone>
          )}
        </Menu>
      )}
    </nav>
  );
}

const BOTTOM_MAIN = ['dashboard', 'crm', 'projects', 'finance'];

/** Phones: modules in a bar at the bottom; the rest (AI, Settings) under «More». */
export function BottomBar({ counts = {} }) {
  const { t } = useI18n();
  const active = useActiveModule();
  const main = MODULES.filter((m) => BOTTOM_MAIN.includes(m.id));
  const more = MODULES.filter((m) => !BOTTOM_MAIN.includes(m.id));
  const moreActive = more.some((m) => m.id === active?.id);
  return (
    <nav className="bottombar" aria-label={t('nav.modules')}>
      {main.map((m) => {
        const Icon = m.icon;
        const current = active?.id === m.id;
        return (
          <NavLink key={m.id} to={m.to} end={m.end} className={cx('bottombar__item', current && 'is-current')} aria-current={current ? 'page' : undefined}>
            <span className="bottombar__icon">
              <Icon aria-hidden="true" />
              {m.id === 'crm' && counts.unread > 0 && <span className="bottombar__badge">{counts.unread > 99 ? '99+' : counts.unread}</span>}
            </span>
            <span className="bottombar__label">{t(m.labelKey)}</span>
          </NavLink>
        );
      })}
      <Menu
        up
        className="bottombar__more"
        label={t('nav.moreModules')}
        trigger={(p) => (
          <button type="button" className={cx('bottombar__item', moreActive && 'is-current')} {...p}>
            <span className="bottombar__icon"><MoreHorizontal aria-hidden="true" /></span>
            <span className="bottombar__label">{t('nav.more')}</span>
          </button>
        )}
      >
        {(close) => more.map((m) => {
          const Icon = m.icon;
          const current = active?.id === m.id;
          return (
            <NavLink key={m.id} role="menuitem" to={m.to} end={m.end} onClick={close} className={cx('menu__item', current && 'is-current')} aria-current={current ? 'page' : undefined}>
              <Icon aria-hidden="true" />{t(m.labelKey)}
              {current && <Check className="menu__check" aria-hidden="true" />}
            </NavLink>
          );
        })}
      </Menu>
    </nav>
  );
}
