import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import useHotkey from '../../hooks/useHotkey.js';
import usePullToRefresh from '../../hooks/usePullToRefresh.js';
import { RefreshCw } from 'lucide-react';
import useResource from '../../hooks/useResource.js';
import { conversationsService, lookupService } from '../../services/index.js';
import { QuickActionsProvider } from '../quick/QuickActionsProvider.jsx';
import CommandPalette from './CommandPalette.jsx';
import AssistantLauncher from '../ai/AssistantLauncher.jsx';
import Topbar, { useActiveModule } from './Topbar.jsx';
import cx from '../../lib/cx.js';
import { NoAccess, ViewAsBanner } from './Access.jsx';
import PwaStatus from './PwaStatus.jsx';
import AddressBar, { CrumbsProvider } from './AddressBar.jsx';
import { FillProvider } from './FillPage.jsx';
import { RibbonProvider } from './Ribbon.jsx';
import { useSession } from '../../app/SessionProvider.jsx';

const COLLAPSE_KEY = 'app.ribbonCollapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

/**
 * App shell: top navigation (title bar · module tabs · ribbon) over the content. No sidebar.
 * See Topbar.jsx and Ribbon.jsx.
 */
export default function AppLayout() {
  const [fill, setFill] = useState(false); // current page fits the window (see FillPage.jsx)
  const [collapsed, setCollapsed] = useState(readCollapsed); // ribbon collapsed to the tabs only
  const [searchOpen, setSearchOpen] = useState(false);
  const appRef = useRef(null);
  usePullToRefresh(appRef);
  const location = useLocation();

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);
  useHotkey('mod+k', () => setSearchOpen((o) => !o));
  // Ctrl/⌘+B shows / hides the ribbon — ignored while typing (inputs, text areas, rich text).
  useHotkey('mod+b', () => toggleCollapsed(), { allowInInputs: false });

  const { data: unreadData } = useResource(() => conversationsService.list({ where: { unread: { gt: 0 } }, pageSize: 50 }), []);
  const unread = (unreadData?.items || []).map((c) => ({ ...c, contactName: lookupService.contact(c.contactId)?.name }));
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const counts = { unread: unread.reduce((a, c) => a + c.unread, 0) };
  const activeModule = useActiveModule();
  const { access } = useSession();
  // Module-level permission gate (role preview in Settings → Users & roles).
  const blocked = access(activeModule?.id ?? (location.pathname === '/' ? 'dashboard' : null)) === 'none';

  return (
    <QuickActionsProvider>
      <CrumbsProvider>
        <FillProvider onChange={setFill}>
          <RibbonProvider>
            <div ref={appRef} className={cx('app', fill && 'is-fill', collapsed && 'is-ribbon-collapsed')}>
              {/* Pull-to-refresh indicator (touch only): sits under the header, which never moves. */}
              <div className="ptr" aria-hidden="true"><span className="ptr__spinner"><RefreshCw /></span></div>
              <a className="sr-only" href="#main">Skip to content</a>
              <div className="main">
                <Topbar
                  onOpenSearch={() => setSearchOpen(true)}
                  unread={unread}
                  counts={counts}
                  collapsed={collapsed}
                  onToggleCollapse={toggleCollapsed}
                />
                <main id="main" className="content" tabIndex={-1}>
                  <AddressBar />
                  <ViewAsBanner />
                  {blocked ? <NoAccess module={activeModule} /> : <Outlet />}
                </main>
              </div>
              <CommandPalette open={searchOpen} onClose={closeSearch} />
              <AssistantLauncher />
              <PwaStatus />
              <ScrollRestoration />
            </div>
          </RibbonProvider>
        </FillProvider>
      </CrumbsProvider>
    </QuickActionsProvider>
  );
}
