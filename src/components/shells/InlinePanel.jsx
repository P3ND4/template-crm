import { useCallback, useEffect, useId, useRef, useState } from 'react';
import cx from '../../lib/cx.js';
import ConfirmDialog from './ConfirmDialog.jsx';

/**
 * InlinePanel — opens IN the page (Explorer-style pane), never as a floating window.
 * Children get `titleId` + `requestClose` (render prop),
 * so a form inside is <FormShell variant="panel" …>. On open it scrolls into view and focuses
 * the first field; Esc closes; with unsaved changes it asks first (the only dialog kept).
 */
export default function InlinePanel({ open = true, onClose, dirty = false, labelledBy, className, children }) {
  const ref = useRef(null);
  const autoId = useId();
  const titleId = labelledBy || `${autoId}-title`;
  const [confirming, setConfirming] = useState(false);

  const requestClose = useCallback(() => {
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
    const field = el.querySelector('input:not([type="hidden"]):not([disabled]), select, textarea, [contenteditable="true"]');
    (field || el).focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && !confirming) { e.stopPropagation(); requestClose(); }
  };

  return (
    <section ref={ref} className={cx('inline-panel', className)} aria-labelledby={titleId} tabIndex={-1} onKeyDown={onKeyDown}>
      {typeof children === 'function' ? children({ titleId, requestClose }) : children}
      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); onClose(); }}
      />
    </section>
  );
}
