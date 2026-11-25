import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * "Priority+" navigation rows: show what fits, put the rest in a «More ▾» menu. Never a horizontal scroll.
 *
 * usePriorityPlus(boxRef, trackRef, opts) measures `track` (overflow: hidden, flex: 1) and, when its content
 * doesn't fit:
 *   1. sets `compactAttr` on `box` first (e.g. the ribbon folds «New» into one «+ New ▾» button) and re-measures;
 *   2. then sets `data-more` on `box` (shows the «More» button) and marks units with `data-ofl`, from the
 *      right, until the row fits. Units matching `pinned` (the current tab / section) are never moved.
 * Returns the indexes (in `units` order) of the units that went into «More».
 * Re-measures on resize, on font load and when the row's content changes (route, page controls, badges).
 */
export function usePriorityPlus(boxRef, trackRef, { units, pinned, compactAttr, enabled = true }) {
  const [hidden, setHidden] = useState('');
  useLayoutEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!enabled || !box || !track) return undefined;
    let raf = 0;
    const fits = () => track.scrollWidth <= track.clientWidth + 1;
    const measure = () => {
      const all = [...track.querySelectorAll(units)];
      all.forEach((el) => el.removeAttribute('data-ofl'));
      box.removeAttribute('data-more');
      if (compactAttr) box.removeAttribute(compactAttr);
      const out = [];
      if (!fits() && compactAttr) box.setAttribute(compactAttr, '');
      if (!fits()) {
        box.setAttribute('data-more', '');
        const candidates = all.filter((el) => el.getClientRects().length > 0 && !(pinned && el.matches(pinned))).reverse();
        for (const el of candidates) {
          if (fits()) break;
          el.setAttribute('data-ofl', '');
          out.push(all.indexOf(el));
        }
      }
      const key = out.sort((a, b) => a - b).join(',');
      setHidden((h) => (h === key ? h : key));
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(box);
    const mo = new MutationObserver(schedule);
    mo.observe(track, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready?.then(schedule).catch(() => {});
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); mo.disconnect(); };
  }, [boxRef, trackRef, units, pinned, compactAttr, enabled]);
  return hidden ? hidden.split(',').map(Number) : [];
}

/**
 * The «More» menu's copy of a row: renders the same children as the row and shows only the units the row
 * moved out (`hidden` indexes, same `units` selector). `hidden = null` shows every unit (phone «⋯» menu).
 */
export function OverflowClone({ hidden, units, className, onPick, children }) {
  const ref = useRef(null);
  const key = hidden ? hidden.join(',') : 'all';
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const apply = () => {
      const set = hidden ? new Set(hidden) : null;
      root.querySelectorAll(units).forEach((el, i) => { el.hidden = set ? !set.has(i) : false; });
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, units]);
  // A click on any control inside closes the menu (the control's own handler runs first). Native listener:
  // React events from portaled page controls bubble to the page, not to this element.
  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const onClick = (e) => { if (e.target.closest('a, button')) setTimeout(() => pick.current?.(), 0); };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
