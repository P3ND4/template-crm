import { useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCorners, pointerWithin, useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import { ArrowRightLeft, ChevronDown } from 'lucide-react';
import cx from '../../lib/cx.js';

function Column({ column, children, count }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section className={cx('kanban__col', isOver && 'is-over', column.tone && `kanban__col--${column.tone}`)} aria-label={`${column.title} (${count})`}>
      <header className="kanban__head">
        <div className="row-between">
          <h2 className="kanban__title">{column.title}<span className="kanban__count">{count}</span></h2>
        </div>
        {column.meta && <p className="kanban__meta">{column.meta}</p>}
      </header>
      <div ref={setNodeRef} className="kanban__list">
        {children}
        {count === 0 && <p className="kanban__empty">{column.emptyLabel}</p>}
      </div>
    </section>
  );
}

/** Compact mode: one tab per column. Tabs are the drop targets (drop a card on a tab to move it there). */
function StageTab({ column, count, selected, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      role="tab"
      aria-selected={selected}
      className={cx('kanban-tab', selected && 'is-selected', isOver && 'is-over', column.tone && `kanban-tab--${column.tone}`)}
      onClick={() => onSelect(column.id)}
    >
      <span className="kanban-tab__title">{column.title}</span>
      <span className="kanban-tab__count">{count}</span>
    </button>
  );
}

function Draggable({ id, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} className={cx('kanban__item', isDragging && 'is-dragging')} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

const stop = (e) => e.stopPropagation();

/** Compact mode: the dragged chip floats just above the finger, so the stage under the finger stays visible. */
function chipAboveFinger({ activatorEvent, draggingNodeRect, overlayNodeRect, transform }) {
  const pt = activatorEvent?.touches?.[0] || activatorEvent?.changedTouches?.[0] || activatorEvent;
  if (!pt || pt.clientX == null || !draggingNodeRect || !overlayNodeRect) return transform;
  const x = transform.x + (pt.clientX - draggingNodeRect.left) - overlayNodeRect.width / 2;
  const left = Math.min(Math.max(draggingNodeRect.left + x, 8), window.innerWidth - overlayNodeRect.width - 8);
  return { ...transform, x: left - draggingNodeRect.left, y: transform.y + (pt.clientY - draggingNodeRect.top) - overlayNodeRect.height - 28 };
}

/**
 * «Move to ▾» on a card: a native select (system picker on phones), so a card can change column without
 * dragging. Stops the events that would start a drag.
 */
export function KanbanMove({ value, columns, onChange, label }) {
  return (
    <label className="kanban-move" title={label} onMouseDown={stop} onTouchStart={stop} onPointerDown={stop} onKeyDown={stop}>
      <ArrowRightLeft aria-hidden="true" />
      <span>{label}</span>
      <ChevronDown aria-hidden="true" />
      <select value={value} aria-label={label} onChange={(e) => { if (e.target.value !== value) onChange(e.target.value); }}>
        {columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
    </label>
  );
}

/**
 * Generic Kanban board.
 * - Mouse: drag after moving 6 px. Touch: PRESS AND HOLD a card (~0.35 s) to pick it up, so swiping always scrolls.
 *   Keyboard: Space to lift, arrows to move between columns, Space to drop.
 * - `compact` (phones): no sideways scrolling — the columns become tabs (with counts) and only the selected
 *   column's cards are listed; drop a card on a tab to move it. `activeColumn` / `onActiveColumn` control the tab.
 * columns: [{ id, title, meta?, tone?, emptyLabel, compactEmptyLabel? }] · items: [{ id, [groupBy]: columnId }]
 * renderCard(item, { overlay, compact }) — in compact mode the dragged copy should be small (tabs stay visible).
 * onMove(itemId, toColumnId)
 */
export default function Kanban({
  columns, items, groupBy = 'stage', renderCard, onMove, label, compact = false, activeColumn, onActiveColumn, tabsLabel, hint,
}) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const active = items.find((i) => i.id === activeId);
  const current = columns.find((c) => c.id === activeColumn) || columns[0];
  const countOf = (id) => items.filter((i) => i[groupBy] === id).length;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={compact ? pointerWithin : closestCorners}
      onDragStart={({ active: a }) => {
        setActiveId(a.id);
        try { navigator.vibrate?.(12); } catch { /* not supported */ }
      }}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active: a, over }) => {
        setActiveId(null);
        if (!over) return;
        const item = items.find((i) => i.id === a.id);
        if (item && item[groupBy] !== over.id) onMove(a.id, over.id);
      }}
      accessibility={{ screenReaderInstructions: { draggable: 'Press Space to pick up the card, use arrow keys to move between columns, Space to drop, Escape to cancel.' } }}
    >
      {compact ? (
        <div className={cx('kanban-compact', activeId && 'is-dragging')}>
          <div className="kanban-tabs" role="tablist" aria-label={tabsLabel || label}>
            {columns.map((col) => (
              <StageTab key={col.id} column={col} count={countOf(col.id)} selected={col.id === current.id} onSelect={onActiveColumn} />
            ))}
          </div>
          {hint && <p className="kanban-compact__hint">{hint}</p>}
          <section className="kanban-compact__panel" role="tabpanel" aria-label={`${current.title} (${countOf(current.id)})`}>
            <header className="kanban-compact__head">
              <h2 className="kanban__title">{current.title}<span className="kanban__count">{countOf(current.id)}</span></h2>
              {current.meta && <p className="kanban__meta">{current.meta}</p>}
            </header>
            <div className="kanban-compact__list">
              {items.filter((i) => i[groupBy] === current.id).map((item) => <Draggable key={item.id} id={item.id}>{renderCard(item, { overlay: false })}</Draggable>)}
              {countOf(current.id) === 0 && <p className="kanban__empty">{current.compactEmptyLabel || current.emptyLabel}</p>}
            </div>
          </section>
        </div>
      ) : (
        <div className="kanban" role="group" aria-label={label}>
          {columns.map((col) => {
            const colItems = items.filter((i) => i[groupBy] === col.id);
            return (
              <Column key={col.id} column={col} count={colItems.length}>
                {colItems.map((item) => <Draggable key={item.id} id={item.id}>{renderCard(item, { overlay: false })}</Draggable>)}
              </Column>
            );
          })}
        </div>
      )}
      <DragOverlay dropAnimation={compact ? null : { duration: 160, easing: 'ease-out' }} modifiers={compact ? [chipAboveFinger] : undefined}>
        {active ? <div className={cx('kanban__item is-overlay', compact && 'is-mini')}>{renderCard(active, { overlay: true, compact })}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
