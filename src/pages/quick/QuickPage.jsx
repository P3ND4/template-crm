import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useT } from '../../i18n/index.jsx';
import { navTrail } from '../../app/navigation.js';
import { useGoBack } from '../../components/shells/BackButton.jsx';
import TaskForm from '../../components/quick/TaskForm.jsx';
import AppointmentForm from '../../components/quick/AppointmentForm.jsx';
import NoteForm from '../../components/quick/NoteForm.jsx';
import ContactForm from '../../components/quick/ContactForm.jsx';
import PaymentForm from '../../components/quick/PaymentForm.jsx';
import ExpenseForm from '../../components/quick/ExpenseForm.jsx';
import NotFoundPage from '../system/NotFoundPage.jsx';

const FORMS = { task: TaskForm, appointment: AppointmentForm, note: NoteForm, contact: ContactForm, payment: PaymentForm, expense: ExpenseForm };
const TITLES = {
  task: 'task.newTitle', note: 'note.newTitle', payment: 'payment.short', expense: 'expenses.newTitle',
  appointment: 'appointment.newTitle', 'edit-appointment': 'appointment.editTitle',
  contact: 'contacts.newTitle', 'edit-contact': 'contacts.editTitle',
};

/**
 * /new/:type and /edit/:type — the quick forms as pages (no modal windows).
 * Opened through useQuickActions().open(type, props): props travel in the history state with
 * `from` (where the user clicked), so Back / Cancel / Save return exactly there.
 * Opened by direct link without that state, forms that need a record go back to their list.
 */
export default function QuickPage() {
  const t = useT();
  const { type } = useParams();
  const location = useLocation();
  const editing = location.pathname.startsWith('/edit/');
  const props = location.state?.quick ?? {};
  const from = location.state?.from || '/';
  const goBack = useGoBack(from);
  const Form = FORMS[type];

  if (!Form) return <NotFoundPage />;
  if (type === 'payment' && !props.invoice) return <Navigate to="/finance/invoices" replace />;
  if (editing && !props.appointment && !props.contact) return <Navigate to={type === 'contact' ? '/crm/contacts' : '/crm/agenda'} replace />;

  const trail = navTrail(from).map((c) => ({ label: t(c.labelKey), to: c.to }));
  const title = t(TITLES[editing ? `edit-${type}` : type]);
  return <Form key={location.key} {...props} fallback={from} breadcrumbs={[...trail, { label: title }]} onClose={goBack} />;
}
