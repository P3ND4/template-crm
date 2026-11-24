import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { lookupService, notesService } from '../../services/index.js';
import { FormPage } from '../shells/index.js';
import { Field, Select, Textarea, useToast } from '../ui/index.js';

/** Quick note — its own page (/new/note). The textarea auto-grows, then scrolls internally. */
export default function NoteForm({ fallback = '/', breadcrumbs, onClose, projectId = '' }) {
  const t = useT();
  const toast = useToast();
  const form = useForm(
    { body: '', projectId },
    {
      validate: (v) => ({ body: !v.body.trim() && t('validation.required') }),
      onSubmit: async (v) => { await notesService.create(v); toast.show(t('note.created')); onClose(); },
    },
  );
  return (
    <FormPage fallback={fallback} breadcrumbs={breadcrumbs} title={t('note.newTitle')} onSubmit={form.submit} dirty={form.dirty} saving={form.saving}>
      <div className="field-grid">
        <Field label={t('note.body')} error={form.errors.body} required><Textarea {...form.bind('body')} minRows={4} maxRows={12} /></Field>
        <Field label={t('note.related')} optional><Select {...form.bind('projectId')} placeholder="—" options={lookupService.projectOptions()} /></Field>
      </div>
    </FormPage>
  );
}
