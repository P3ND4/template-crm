import { createContext, useContext, useEffect } from 'react';

/**
 * "Fill" pages fit the window on desktop: the page itself never scrolls. The header stays put and
 * the element marked `.fill` takes the rest of the height, with the same gap at the bottom as on
 * the sides; long content scrolls INSIDE it (`.fill-scroll`, or the panes of comms / email / agenda).
 * Phones and short windows keep normal page scrolling (CSS: layout.css → "Fill pages").
 */
const FillContext = createContext(() => {});

export function FillProvider({ children, onChange }) {
  return <FillContext.Provider value={onChange}>{children}</FillContext.Provider>;
}

/** Call from a page component to make it a fill page while it is mounted. */
export function useFillPage(enabled = true) {
  const setFill = useContext(FillContext);
  useEffect(() => {
    if (!enabled) return undefined;
    setFill(true);
    return () => setFill(false);
  }, [enabled, setFill]);
}
