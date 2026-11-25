import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bot, Send, Sparkles } from 'lucide-react';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';
import { Badge, Button, IconButton, Textarea } from '../ui/index.js';
import { useI18n } from '../../i18n/index.jsx';
import useAiStatus from '../../hooks/useAiStatus.js';
import AiText from './AiText.jsx';
import { aiService } from '../../services/index.js';
import cx from '../../lib/cx.js';

const SUGGESTIONS = ['overdue', 'agenda', 'risk', 'leads', 'unanswered', 'revenue'];

/**
 * Assistant: answers from the CRM data with links and suggested actions (aiService.ask). With a live model the
 * text is written by the model; otherwise it is the demo answer from intent matching.
 */
export default function AssistantChat({ compact, onNavigate }) {
  const { t, locale } = useI18n();
  const ai = useAiStatus();
  const quick = useQuickActions();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages, thinking]);

  const ask = async (text) => {
    const q = text.trim();
    if (!q || thinking) return;
    const history = messages.map((m) => ({ role: m.role, text: m.role === 'user' ? m.text : m.text || t(`ai.assistant.answers.${m.key}`, m.vars) }));
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setDraft('');
    setThinking(true);
    const a = await aiService.ask(q, { history, locale });
    setThinking(false);
    setMessages((m) => [...m, { role: 'assistant', ...a }]);
  };

  return (
    <div className={cx('assistant', compact && 'assistant--compact')}>
      <div className="assistant__scroll" aria-live="polite">
        {messages.length === 0 && (
          <div className="assistant__intro">
            <span className="ai-card__icon" aria-hidden="true"><Bot /></span>
            <p className="assistant__hello">{t('ai.assistant.hello')}</p>
            <p className="muted" style={{ fontSize: 13 }}>{t('ai.assistant.helloSub')}</p>
            {ai.live
              ? <Badge tone="success">{t('ai.liveBadge', { model: ai.model.replace(/^.*\//, ''), provider: ai.provider })}</Badge>
              : !ai.pending && <Badge tone="warning">{t('ai.demoBadge')}</Badge>}
          </div>
        )}
        <ol className="assistant__msgs">
          {messages.map((m, i) => (
            <li key={i} className={cx('amsg', `amsg--${m.role}`)}>
              {m.role === 'user' ? <p>{m.text}</p> : (
                <>
                  {m.text ? <AiText text={m.text} /> : <p>{t(`ai.assistant.answers.${m.key}`, m.vars)}</p>}
                  {m.liveError && <p className="amsg__note">{t(`ai.liveError.${m.liveError}`)}</p>}
                  {m.items?.length > 0 && (
                    <ul className="amsg__items">
                      {m.items.map((it) => (
                        <li key={it.to + it.label}><Link to={it.to} onClick={onNavigate}><span className="truncate">{it.label}</span><span className="subtle">{it.meta}</span><ArrowUpRight size={14} aria-hidden="true" /></Link></li>
                      ))}
                    </ul>
                  )}
                  {m.actions?.length > 0 && (
                    <div className="chip-row" style={{ marginTop: 8 }}>
                      {m.actions.map((a) => (a.quick
                        ? <Button key={a.key} size="sm" plain onClick={() => quick.open(a.quick)}>{t(`ai.assistant.actions.${a.key}`)}</Button>
                        : <Button key={a.key} size="sm" plain to={a.to} onClick={onNavigate}>{t(`ai.assistant.actions.${a.key}`)}</Button>))}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
          {thinking && <li className="amsg amsg--assistant amsg--thinking" aria-label={t('ai.assistant.thinking')}><span /><span /><span /></li>}
        </ol>
        <div ref={end} />
      </div>
      <div className="assistant__suggest chip-row" aria-label={t('ai.assistant.suggestions')}>
        {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => ask(t(`ai.assistant.prompts.${s}`))}><Sparkles size={12} aria-hidden="true" /> {t(`ai.assistant.prompts.${s}`)}</button>)}
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <div className="composer__row">
          <Textarea className="composer__input" value={draft} onChange={(e) => setDraft(e.target.value)} minRows={1} maxRows={5} placeholder={t('ai.assistant.placeholder')} aria-label={t('ai.assistant.placeholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(draft); } }} />
          <IconButton icon={Send} label={t('comms.send')} className="composer__send" type="submit" />
        </div>
      </form>
    </div>
  );
}
