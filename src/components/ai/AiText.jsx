import { Fragment } from 'react';

/**
 * Renders the model's reply safely (React elements only, never HTML): paragraphs, "- " / "1. " lists and
 * **bold**. Anything else shows as plain text.
 */
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part.replace(/(^|\s)\*([^*\s][^*]*)\*(?=\s|$|[.,;:])/g, '$1$2')}</Fragment>
  ));
}

export default function AiText({ text }) {
  const blocks = [];
  let list = null;
  text.replace(/\r/g, '').split('\n').forEach((raw) => {
    const line = raw.trim().replace(/^#{1,6}\s+/, '');
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      const ordered = /^\d/.test(line);
      if (!list || list.ordered !== ordered) { list = { ordered, items: [] }; blocks.push(list); }
      list.items.push(bullet[1]);
    } else if (line) {
      list = null;
      blocks.push(line);
    } else {
      list = null;
    }
  });
  return (
    <div className="ai-text">
      {blocks.map((b, i) => {
        if (typeof b === 'string') return <p key={i}>{inline(b)}</p>;
        const Tag = b.ordered ? 'ol' : 'ul';
        return <Tag key={i}>{b.items.map((it, k) => <li key={k}>{inline(it)}</li>)}</Tag>;
      })}
    </div>
  );
}
