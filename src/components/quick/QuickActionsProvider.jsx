import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Opens the quick forms (task, appointment, note, contact, payment, expense) from anywhere:
 * topbar "+ New", command palette, lists and detail pages.
 * They are PAGES, not modal windows: open() navigates to /new/:type (or /edit/:type) and Back,
 * Cancel or Save return to where the user was. Callbacks (onSaved) are not needed: the page the
 * user returns to loads its data again.
 */
const QuickActionsContext = createContext(null);
const EDIT_KEYS = { appointment: 'appointment', contact: 'contact' };

export function QuickActionsProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.pathname + location.search;
  const open = useCallback((type, props = {}) => {
    const editing = Boolean(EDIT_KEYS[type] && props[EDIT_KEYS[type]]);
    // History state must be serializable: drop callbacks.
    const quick = Object.fromEntries(Object.entries(props).filter(([, v]) => typeof v !== 'function'));
    navigate(`/${editing ? 'edit' : 'new'}/${type}`, { state: { quick, from } });
  }, [navigate, from]);
  const value = useMemo(() => ({ open, close: () => {} }), [open]);
  return <QuickActionsContext.Provider value={value}>{children}</QuickActionsContext.Provider>;
}

export function useQuickActions() {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) throw new Error('useQuickActions must be used inside <QuickActionsProvider>');
  return ctx;
}
