# Structure

```
template-crm/
├─ index.html · vite.config.js (React + PWA manifest/Workbox) · vercel.json (SPA rewrite)
├─ public/              favicon.svg · icons/ (PWA + Apple touch icons) · splash/ (iOS launch screens) · screenshots/ (install dialog)
├─ docs/DEMO_ACCOUNTS.md  demo sign-in accounts (kept off the login screen)
├─ docs/API_INTEGRATION.md  guide to replace the mock services with a real API
├─ docs/DEVELOPMENT_GUIDE.md  how everything is built + how to fork it into a simpler template
├─ scripts/             qa/ (audit.cjs, shot.cjs, routes.cjs, session.cjs) · make-icons.cjs · make-splash.cjs
├─ docs/screenshots/
└─ src/
   ├─ main.jsx          providers (i18n, session, toasts) + router
   ├─ app/
   │  ├─ router.jsx     route map
   │  ├─ navigation.js  modules & sections (tabs, ribbon, palette, path)
   │  ├─ pwa.js         install prompt, installed/online state, local notifications
   │  ├─ SessionProvider.jsx  signed-in user (mock), "view as" role, module access, theme, brand accent
   │  └─ theme.js       brand accent presets
   ├─ styles/
   │  ├─ tokens.css     ← all design tokens (brand lives here)
   │  ├─ base.css       reset, typography, helpers (mobile-first)
   │  ├─ components.css UI component styles
   │  └─ layout.css     header (title bar · tabs · ribbon), shells, palette, dashboard
   ├─ i18n/             en.js · es.js (same keys) · index.jsx (useT)
   ├─ components/
   │  ├─ ui/            Button, IconButton, Field, Input, Select, Textarea (auto-grow), DatePicker,
   │  │                 Card, Badge, Avatar, Tabs, SegmentedControl, Table, Pagination, Menu,
   │  │                 Toast, EmptyState, Skeleton, DataState, Kpi, Kanban, RichTextEditor, Switch
   │  ├─ shells/        FormShell · InlinePanel · PageShell · FormPage · BackButton · ConfirmDialog
   │  ├─ layout/        AppLayout · Topbar (title bar · module tabs · ribbon) · Ribbon (contextual tab / page controls) · AddressBar (location path) · FillPage · CommandPalette · Access (NoAccess page, view-as banner) · PwaStatus (service worker: offline ready / new version)
   │  ├─ quick/         QuickActionsProvider + Task / Appointment / Note / Contact modals
   │  ├─ list/          ListToolbar · SearchInput · FilterSelect · ViewToggle
   │  ├─ crm/           shared cells (PersonCell, Score, StatusBadge, RowMenu, UserChip)
   │  ├─ ai/            AiModuleShell (run / configure / history) · AssistantChat · AssistantLauncher (floating)
   │  ├─ finance/       DocPreview (paper + print) · LineEditor · TotalsBox
   │  ├─ comms/         ChannelHeader · ConversationList · Bubbles · WaComposer · ContactPanel
   │  └─ charts/        ChartCard (with table view) · RevenueExpensesChart · HBarChart
   ├─ hooks/            useResource · useUrlState · useListState · useForm · useHotkey · useFocusTrap · useScrollLock · useCssVars
   ├─ services/         client.js (mock adapter) · index.js (entity services) · dashboard · crm · communications · prospecting · projects · finance · ai · settings · auth · search · lookup
   ├─ data/
   │  ├─ mock/          core.js · people.js · users.js · prospecting.js · projectDetails.js · finance.js · ai.js · settings.js   (never imported by components)
   │  ├─ constants.js   static option lists (neighborhoods, services, sources)
   │  └─ schema.md      entities → DB model
   ├─ lib/              format (USD, dates) · money (exact cents) · color (accent shades, contrast) · random (seeded) · cx
   └─ pages/            auth/ (Login, ForgotPassword, RequireAuth, AuthLayout) · dashboard/ · crm/{leads,contacts,pipeline,agenda,communications,prospecting}/ · projects/ (+ tabs/) · finance/ · ai/ · settings/ (one file per section + shared SettingsForm/SaveBar) · system/ (404)
```

## Routes

| Route | Screen | Status |
|---|---|---|
| `/login?next=` · `/forgot-password` | Sign in · reset password — public (demo accounts: `docs/DEMO_ACCOUNTS.md`) | ✅ |
| `/` | Dashboard (`?range=`) | ✅ |
| `/crm/communications/whatsapp?c=&f=&q=` | WhatsApp inbox (list · thread · contact panel) | ✅ |
| `/crm/communications/sms?c=&f=&q=` | SMS / MMS inbox (consent, STOP, quiet hours, segments) | ✅ |
| `/crm/communications/email?folder=&label=&c=&q=` | Email (folders · list · reader) | ✅ |
| `/crm/communications/email/compose?to=&reply=` | Email composer (page) | ✅ |
| `/crm/communications/:channel/:id` | Expanded conversation (page) | ✅ |
| `/crm/agenda?view=&date=&type=&assignee=` · `/crm/agenda/:id` | Calendar / appointment page | ✅ |
| `/crm/contacts?tab=&q=&hood=&owner=&view=` · `/crm/contacts/:id?tab=` | Contacts / contact page | ✅ |
| `/crm/leads?status=&source=&service=&assignee=&view=` · `/new` · `/:id` · `/:id/edit` | Leads / new / lead page / edit | ✅ |
| `/crm/prospecting?tab=&list=&segment=&status=` | Prospects · lists · campaigns · sequences | ✅ |
| `/crm/pipeline?owner=&q=` · `/crm/pipeline/:id` | Kanban / opportunity page | ✅ |
| `/projects?status=&manager=&hood=&view=` | Projects list (table / cards) | ✅ |
| `/projects/new` · `/projects/:id/edit` | New / edit project (page) | ✅ |
| `/projects/:id?tab=` | Project detail (11 tabs) | ✅ |
| `/finance/estimates?status=&project=` · `/new` · `/:id` · `/:id/edit` | Estimates list / builder / detail with PDF preview | ✅ |
| `/finance/invoices?status=&project=` · `/new` · `/:id` · `/:id/edit` | Invoices list / builder / detail + payments | ✅ |
| `/finance/expenses?type=&status=&category=&project=` | Expenses & purchase orders | ✅ |
| `/finance/reports?range=` | Payments & reports | ✅ |
| `/ai` | AI hub | ✅ |
| `/ai/communications` · `/prospecting` · `/lead-finder` · `/patterns` · `/email-mining` · `/campaigns` (`?view=results\|config\|history`) | AI modules | ✅ |
| `/ai/assistant` | AI assistant (full page; also floating panel everywhere) | ✅ |
| `/settings` → `/settings/profile` | My profile & preferences (language, theme) | ✅ |
| `/settings/organization` | Company letterhead, logo, brand color, regional | ✅ |
| `/settings/users` | Team, invitations, permission matrix, view as role | ✅ |
| `/settings/channels` | WhatsApp Business, email (signature), calendar | ✅ |
| `/settings/templates?channel=` | WhatsApp / email templates | ✅ |
| `/settings/catalog?q=&kind=&sort=` | Services & products for the builder | ✅ |
| `/settings/billing` | Sales tax, terms, payment methods, reminders | ✅ |
| `/settings/integrations` | Ad accounts, lead sources, planned (phase 2) | ✅ |
| `/settings/ai` | Assistant, tone, data access, review, usage | ✅ |
| `/settings/notifications` | Events × channels, digest, quiet hours | ✅ |

## Action → Page or Panel (no modal windows)

Rule: the app navigates like Windows Explorer. Every form or viewer opens **in the page**: a short action
opens an **inline panel** at the top of the current page; anything else is its own **page** (with Back /
Forward / Up in the title bar). The only dialogs left are confirmations ("Delete?", "Leave without saving?").

| Action | Pattern |
|---|---|
| New task · note · appointment · contact · payment · expense | **Page** `/new/:type` (opened with `useQuickActions().open(type, props)`; Save/Cancel return where you were) |
| Edit appointment · edit contact (quick) | **Page** `/edit/appointment` · `/edit/contact` |
| New / edit **Lead** (full) | Page `/crm/leads/new` · `/:id/edit` |
| Contact record · Lead detail · Opportunity · Appointment detail | Page |
| New / edit Project · Project detail (tabs) | Page |
| Estimate / Invoice builder | Page `/finance/{estimates,invoices}/new` · `/:id/edit` |
| Email composer · expanded conversation | Page `/crm/communications/email/compose` · `/:channel/:id` |
| Invite user · catalog item · template (with live preview) | Inline panel (`InlinePanel`) at the top of the settings section |
| Record SMS consent | Inline panel in the contact side pane |
| Document preview · photo viewer · receipt preview | Inline panel at the top of the tab / list |
| WhatsApp / SMS reply · internal note · email quick reply | Inline composer in the thread pane |
| Change selection status · approve / reject expense · change a user's role | Inline (row or bulk) |
| Settings sections | Page with sticky Save bar (`SettingsForm`) |
| AI assistant | Side panel (non-blocking), opened from the title bar (desktop) or the floating button (phones) |
| Confirm / delete / discard changes · revoke invitation | Dialog (`ConfirmDialog`) — the only dialog |

**Shared anatomy** (`FormShell`): fixed header (title + ✕ or Back) · body that scrolls vertically only · fixed footer (Cancel / Save + save state).
Field grids collapse from 2 columns to 1 below 640px. Textareas auto-grow and then scroll internally.
Validation is inline, focus goes to the first invalid field, **Esc** closes a panel (it asks first if there are changes), **Ctrl/⌘+Enter** saves.

## Fill pages (no page scroll on desktop)

Agenda, WhatsApp / SMS, Email and the Dashboard fit the window (≥1024px wide, ≥600px tall): the header
stays put and the main card takes the rest, with the same gap at the bottom as on the sides; content scrolls
inside it. The Dashboard is split into three views (Overview · Performance · Activity, `?view=`).
Opt in with `useFillPage()` and the class `fill` on the element that fills (see `components/layout/FillPage.jsx`).
Phones and short windows keep normal page scrolling.
