import { useSession } from '../../app/SessionProvider.jsx';
import { format } from 'date-fns';
import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { lookupService, tasksService } from '../../services/index.js';
import { FormPage } from '../shells/index.js';
import { DatePicker, Field, Input, Select, Textarea, useToast } from '../ui/index.js';

/** Quick task — its own page (/new/task), reached from "+ New", lists and detail pages. */
export default function TaskForm({ fallback = '/', breadcrumbs, onClose, projectId = '', onSaved }) {
  const t = useT();
  const session = useSession();
  const toast = useToast();
  const form = useForm(
    { title: '', dueAt: format(new Date(), 'yyyy-MM-dd'), priority: 'medium', projectId, assigneeId: session.user.id, notes: '' },
    {
      validate: (v) => ({ title: !v.title.trim() && t('validation.required'), dueAt: !v.dueAt && t('validation.required') }),
      onSubmit: async (v) => {
        await tasksService.create({ ...v, dueAt: new Date(`${v.dueAt}T12:00:00`).toISOString(), done: false });
        toast.show(t('task.created'));
        onSaved?.();
        onClose();
      },
    },
  );
  const users = lookupService.users().map((u) => ({ value: u.id, label: u.name }));
  return (
    <FormPage fallback={fallback} breadcrumbs={breadcrumbs} title={t('task.newTitle')} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={t('common.create')}>
      <div className="field-grid">
        <Field label={t('task.title')} error={form.errors.title} required full><Input {...form.bind('title')} autoComplete="off" /></Field>
        <div className="field-grid field-grid--2">
          <Field label={t('task.due')} error={form.errors.dueAt} required><DatePicker {...form.bind('dueAt')} /></Field>
          <Field label={t('task.priority')}>
            <Select {...form.bind('priority')} options={['high', 'medium', 'low'].map((p) => ({ value: p, label: t(`task.priorities.${p}`) }))} />
          </Field>
        </div>
        <div className="field-grid field-grid--2">
          <Field label={t('task.related')} optional><Select {...form.bind('projectId')} placeholder="—" options={lookupService.projectOptions()} /></Field>
          <Field label={t('leads.fields.assignee')}><Select {...form.bind('assigneeId')} options={users} /></Field>
        </div>
        <Field label={t('task.notes')} optional full><Textarea {...form.bind('notes')} minRows={2} maxRows={6} /></Field>
      </div>
    </FormPage>
  );
}
