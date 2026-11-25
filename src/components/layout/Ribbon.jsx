import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Ribbon (simplified, one line) under the module tabs — Office-style.
 *
 * - The module part (Go to · New) is built by the header from navigation.js.
 * - A page adds its own controls with <RibbonPage> (e.g. Dashboard: period and view).
 * - A record page (lead, contact, project…) declares a CONTEXTUAL TAB with <RibbonContext label>:
 *   its action buttons move into the ribbon under that tab, like "Table tools" in Office.
 *
 * Pages keep their buttons and handlers as normal JSX; they are rendered into the ribbon through a
 * portal, so state stays in the page. The same children are also portaled into the «More ▾» menu (wide
 * screens, when they don't fit) and the phone's «⋯» menu, so keep them stateless (props + handlers). Wrap related buttons in <RibbonGroup> to get a separator.
 */
const RibbonCtx = createContext(null);

export function RibbonProvider({ children }) {
  const [contextLabel, setContextLabel] = useState(null);
  const [contextSlot, setContextSlot] = useState(null);
  const [pageSlot, setPageSlot] = useState(null);
  // Copies shown inside menus: the ribbon's «More ▾» (items that don't fit) and the phone's «⋯» (all of them).
  const [contextCloneSlot, setContextCloneSlot] = useState(null);
  const [pageCloneSlot, setPageCloneSlot] = useState(null);
  const [pageControls, setPageControls] = useState(0); // how many <RibbonPage> are mounted (phone shows «⋯» only then)
  const value = useMemo(() => ({
    contextLabel, setContextLabel, contextSlot, setContextSlot, pageSlot, setPageSlot,
    contextCloneSlot, setContextCloneSlot, pageCloneSlot, setPageCloneSlot, pageControls, setPageControls,
  }), [contextLabel, contextSlot, pageSlot, contextCloneSlot, pageCloneSlot, pageControls]);
  return <RibbonCtx.Provider value={value}>{children}</RibbonCtx.Provider>;
}

export const useRibbonState = () => useContext(RibbonCtx);

/** Contextual tab for the record on screen. Children = its actions (Buttons). */
export function RibbonContext({ label, children }) {
  const { setContextLabel, contextSlot, contextCloneSlot } = useContext(RibbonCtx);
  useEffect(() => {
    setContextLabel(label);
    return () => setContextLabel(null);
  }, [label, setContextLabel]);
  return (
    <>
      {contextSlot && createPortal(children, contextSlot)}
      {contextCloneSlot && createPortal(children, contextCloneSlot)}
    </>
  );
}

/** Extra controls for the current page, appended to the module ribbon. */
export function RibbonPage({ children }) {
  const { pageSlot, pageCloneSlot, setPageControls } = useContext(RibbonCtx);
  useEffect(() => {
    setPageControls((n) => n + 1);
    return () => setPageControls((n) => n - 1);
  }, [setPageControls]);
  return (
    <>
      {pageSlot && createPortal(children, pageSlot)}
      {pageCloneSlot && createPortal(children, pageCloneSlot)}
    </>
  );
}

/** A group of ribbon buttons (separator after it). `label` is read by screen readers. */
export function RibbonGroup({ label, children }) {
  return <div className="ribbon__group" role="group" aria-label={label}>{children}</div>;
}
