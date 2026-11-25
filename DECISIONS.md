# Decisions & assumptions

## Default look (generic, easy to rebrand)

| Role | Value | Token |
|---|---|---|
| Page background | `#F3F3F3` (neutral gray) | `--bg` |
| Text / header | `#1B1B1B` text, `#1F1F1F` graphite header | `--text`, `--brand` |
| Raised dark surfaces | `#2B2B2B`, `#3A3A3A` | `--brand-2`, `--brand-3` |
| Accent (primary buttons, links, active) | `#0063B1` cobalt, the Windows 10 default accent (white text 6.1:1, AA) | `--accent` |
| Borders | `#E1E1E1`, `#C4C4C4` | `--border`, `--border-strong` |
| Radius | `0` containers, `2px` controls (see Shape language) | `--radius-*` |
| Display font | **Work Sans** (titles, wordmark) | `--font-display` |
| Logo | Text wordmark "Template." (period included), mark "T." | Sidebar, topbar, login, icons |
| Buttons | UPPERCASE + letter-spacing | `.btn` |

Everything lives in `src/styles/tokens.css` (and the accent presets in `src/app/theme.js`), so a new brand means editing those two files, then `npm run icons` and `npm run splash` with the brand mark and colors. The accent can also be changed at runtime in Settings → Organization (6 AA presets from the Windows accent palette: cobalt, teal, green, purple, crimson, graphite, or any hex with a contrast check).

## Shape language (Windows 8/10 inspired)

- **Square containers**: cards, panels, modals, kanban columns and tiles use `--radius-lg: 0`.
- **2px controls**: buttons, inputs, menus, chips and badges use `--radius-sm` / `--radius` / `--radius-pill` = `2px`. Only switches (`--radius-round`), avatars and status dots stay round.
- **Flat**: `--shadow-1: none`; cards rely on a 1px border. Overlays (menus, modals, toasts) keep `--shadow-2/3`.
- **Buttons**: secondary buttons are gray (`--surface-3`) with no border; hover adds a 2px inset ring, press scales to 98%.
- **Inputs**: focus shows a 2px accent underline (Windows 10 text box) instead of a glow.
- **Focus**: a 2px rectangle in the text color (`--focus-ring`); white on the dark header and a double ring on filled buttons.
- **Selection**: the current module tab joins the white ribbon with an accent line on top; active ribbon buttons are tinted with an accent underline; segmented controls and channel tabs underline the selected option (Pivot style).
- **Type**: page titles are large and light (Work Sans 300, 36px on desktop), the Metro look.
- To go back to soft corners, change the four radius tokens and `--shadow-1` in `tokens.css`.

## Typography
- **Inter** is used for the whole UI. It is loaded locally with `@fontsource/inter` (400/500/600/700) and uses `tnum` for figures.
- **Work Sans** is used only for the wordmark and page titles. Also loaded locally. Swap `--font-display` for another brand font.

## Color & data viz
- Status colors pass AA as text on white and on their soft backgrounds: success `#107C10`, warning `#9D5D00`, danger `#C42B1C`, info `#005A9E`.
- Chart series: `--chart-1 #0063B1` (cobalt) and `--chart-2 #E3008C` (magenta). Blue vs magenta stays distinguishable with color-vision deficiencies and both are ≥3:1 against the surface. Dark theme uses lighter versions (`#4DA3EE`, `#FF5BC1`).
- Project covers are flat Windows tile colors (cobalt, purple, teal, crimson, green, orange), not gradients. The sign-in panel shows a small tile mosaic.
- Charts have one axis, thin bars with 4px rounded ends, a legend when there are 2+ series, a hover tooltip, and a **"Show data table"** view on every chart.
- **No invented deltas or targets.** The KPIs only show factual context (count, range). A missing value renders "—".

## Interaction
- **No modal windows** (navigation like Windows Explorer, requested for this template): forms and viewers open in the page. Quick forms are pages (`/new/:type`, `/edit/:type`); short forms and previews are inline panels (`InlinePanel`) at the top of the current page. The only dialog left is `ConfirmDialog` (delete, discard changes). `FormShell` is the single form anatomy (fixed header, scrolling body, fixed footer), used by `FormPage` and `InlinePanel`.
- **Location path** under the ribbon (module › section › record), built from `navigation.js` plus the crumbs a page declares through `PageShell`. Back · Forward · Up are in the title bar.
- **Fill pages** (desktop): Agenda, WhatsApp / SMS, Email and the Dashboard fit the window; the page never scrolls, the main card does, with equal gaps on all four sides. The Dashboard is split into Overview · Performance · Activity views.
- **No floating button on desktop**: the AI assistant opens from the title bar; phones keep the floating button.
- **Back**: `navigate(-1)` when there is in-app history (`history.state.idx > 0`). Otherwise it goes to the parent list. Filters, tabs and pages live in the URL (`useUrlState`). Scroll is restored by React Router's `<ScrollRestoration>` (data router).
- **Unsaved changes**: inline panels ask on Esc or ✕. Pages use `useBlocker` (covers Back, links and the browser back button).
- The ribbon collapsed state is kept in `localStorage` (`app.ribbonCollapsed`), as a per-user convenience only.
- Dark theme: same token names under `[data-theme="dark"]`; users pick light / dark / system in My profile.

## Pipeline (Kanban) on touch screens
- **Swipe scrolls, press-and-hold drags**: on touch screens a card is picked up only after holding it ~0.35 s (light vibration where supported), so swiping over a full board always scrolls. Mouse drag starts after 6 px; keyboard: Space + arrows.
- **Phones (< 600px): no sideways scrolling.** The stages become tabs with counts (all visible, 4 per row) and only the selected stage's cards are listed (`?stage=`). Drop a held card on a tab to move it; while dragging, the card shrinks to a chip above the finger so the tabs stay visible. Tablets and desktop keep the full board.
- **«Move to ▾» on every card** (native select → the system picker on phones): changing stage never depends on drag precision.

## Navigation (top navigation, no sidebar)
- **Three rows at the top, like an Office / Windows app**:
  1. **Title bar** (graphite): Back · Forward · Up, the wordmark, search (command palette), AI assistant, notifications, user menu.
  2. **Module tabs**: Dashboard · CRM · Projects · Finance · AI · Settings. A tab navigates to its module; the current module's tab never navigates, it just shows its ribbon.
  3. **Ribbon** (simplified, one line): *Go to* (the module's sections, with badges), *New* (what you can create in that module) and the page's own controls (e.g. Dashboard: view and period).
- **Contextual tab**: on a record (lead, contact, project, opportunity, appointment, estimate, invoice) a colored tab appears after the modules ("Lead", "Invoice"…) and is selected by default; the ribbon shows that record's actions (edit, convert, send, schedule…). Pages declare it with `<RibbonContext label>` and keep their buttons and handlers; the buttons are portaled into the ribbon. Clicking the module tab switches back to the module ribbon.
- **Collapse the ribbon** with the chevron at the end of the tabs or **Ctrl/⌘ + B** (ignored while typing): only the tabs stay. Clicking the current tab opens it again. Remembered per browser.
- **Nothing scrolls sideways** (priority+): from 600px up, the tabs and the ribbon show what fits and the rest goes into a **«More ▾»** menu at the end of the row (`components/layout/Overflow.jsx`). The ribbon first folds *New* into one **«+ New ▾»** button, then moves items from the right. The current tab, the contextual tab and the current section never move. The page's own controls (`<RibbonPage>`, `<RibbonContext>`) are copied into «More» too, so they keep working there.
- **Phones (< 600px)**: the modules move to a **bottom bar** (Dashboard · CRM · Projects · Finance · More → AI, Settings), like a native app. Under the title bar there is one row: **section ▾** (the module's sections) · **+** (New) · **⋯** (the page's controls or the record's actions). The title bar keeps Back, the wordmark, a search icon, notifications and the user. Everything anchored to the bottom (toasts, assistant button, save bar, page-form footer) sits above the bar via `--bottom-inset` / `--bottombar-h`.
- The header height is measured at runtime into `--topbar-h`, so sticky table headers, page-form headers and fill pages always sit right under it.
- Everything comes from one config (`src/app/navigation.js`): tabs, ribbon sections, command palette, location path and permissions.

## Responsive
- Mobile-first CSS. Page chrome (header, dialogs) uses viewport breakpoints 480 / 640 / 768 / 1024 / 1280 / 1440.
- **Page content responds to the space it actually has** (CSS container queries on `.content`, container `page`), not to the screen width. Wider content means more table columns, more cards per row and earlier split views (inbox, detail + side panel, document + preview). Margins stay the same (16 / 24 / 32px). Content max width is 2400px, so even 2560px screens get more columns instead of bigger margins; at ≥2200px of content the 10 dashboard KPIs fit in one row.
- Container widths used: 560 · 700 · 720 · 960 · 1120 · 1216 · 1600.
- Audited automatically at **320, 375, 414, 600, 768, 1024, 1280, 1536, 1920 and 2560px** on 30 routes: no horizontal page overflow and no console errors or warnings.
- Tables: low-priority columns hide progressively based on the content width (`hide: 'md' | 'lg' | 'xl' | 'xxl' | '3xl'`). Below 1280px a table scrolls inside its own box, never the page. On phones, filters sit in one horizontally scrollable row.

## CRM module
- **Lists**: q, filters, sort, page and view (table/cards) all live in the URL (`useListState`), so Back and shared links restore the exact view. Rows open the record **page**, and the row "⋯" menu holds secondary actions.
- **Wide tables**: the header is sticky under the topbar. Instead of scrolling horizontally on desktop, low-priority columns hide below set widths (`hide: 'md'|'lg'|'xl'|'xxl'` on the column).
- **WhatsApp**: the 24-hour customer-service window is computed from the last inbound message. When it is closed the composer warns and only allows approved templates (WhatsApp Business rule). Internal notes are stored as messages with `isNote`, styled differently and never sent.
- **Email**: one shape shared with WhatsApp (`conversations` + `messages`, `channel` field). Folders and labels are fields on the conversation. The rich text editor is a light `contentEditable` with the same props a TipTap/Lexical editor would take later.
- **Pipeline / Agenda drag & drop**: `@dnd-kit/core` with Pointer and Keyboard sensors, so it works with mouse, touch and keyboard (Space, arrows, Space).
- **Agenda colors by type** are tokens (`--evt-*`) and always come with a text label (legend + chip text), never color alone.
- **Prospecting** metrics are computed from prospect statuses: reply rate = (replied + meeting + converted) ÷ contacted. "Convert to lead" creates a lead and opens it.

## Data
- Mock data is generated **deterministically, relative to today**, so the demo always looks current. All people are fictional: phones `(305) 555-01xx`, emails `@example.com`.
- Revenue = payments received (`paid_at`) inside the range. Outstanding = sent + partial + overdue (total − paid).
- "Budget risk" = active project where budget used − progress > 10 points.
- Services simulate 180–420 ms of latency, so skeletons and loading states are exercised.

## SMS (US clients text more than they email)
- A third channel next to WhatsApp and Email, with the same inbox UI (`MessagingPage` serves WhatsApp and SMS). Each conversation keeps one shape (`channel: 'sms'`), so a provider (Twilio, Telnyx, Vonage, Bandwidth) plugs in behind `communicationsService` like the others.
- **Compliance built into the UI** (US carriers + TCPA/CTIA):
  - **Consent per contact** (`contact.smsConsent`: `opted_in` · `unknown` · `opted_out`, plus source, date and who recorded it). With no consent you can reply, but reminders and offers need consent first ("Record consent" in the contact panel).
  - **STOP** blocks texting, and the service refuses too (409 `opted_out`). Only the client can undo it by replying START. Auto-replies for STOP / HELP / START are editable.
  - **First text** of a conversation gets the brand name and the opt-out footer automatically.
  - **Quiet hours** (default 9 PM–8 AM, recipient's local time): texts written then are scheduled for the morning, never sent at night.
  - **Carrier registration** (A2P 10DLC brand + campaign) is shown in Settings with its status. Toll-free numbers are also supported.
- **Segment counter**: GSM-7 = 160 characters (153 per part), any emoji or special character switches to Unicode = 70 (67 per part). The composer and the template editor show "N characters · N SMS · encoding", because carriers bill per segment (`src/lib/sms.js`).
- **MMS**: images up to 5 MB (can be turned off in Settings).
- Mock: 8 fictional SMS threads (reminder with "C" confirm, showroom address, photo by MMS, an opt-out by STOP, a new lead with no consent…), all generated with their own seed so the rest of the demo data stays identical.

## Projects module
- **Projected margin** = (contract value − estimated cost at completion) ÷ contract value. Estimated cost = `max(budget, spent ÷ progress)` once progress ≥ 10%, otherwise the budget. Shown as red under 10%, amber under 18% and green otherwise, always with the number.
- **At budget risk** = budget used − progress > 10 points. The same rule is used on the Dashboard.
- Budget is split by category (design fees, labor, materials, furniture, subcontractors, permits, freight) as budget vs actual with the variance.
- The **Gantt** is plain HTML/CSS with no library: one bar per phase with its completed share and a "today" line. It scrolls inside its own box on phones.
- **Photos** in the demo are colored placeholder tiles, so no real or third-party images are used. Uploads are mocked (the file name is added). Real storage (Supabase Storage) plugs into `projectsService.addDocuments`.
- Each project tab is its own component in `pages/projects/tabs/`. The active tab lives in the URL (`?tab=`), so Back returns to it.

## Finance module
- **Money math in integer cents** (`src/lib/money.js`). Each line is base (qty × price), minus discount %, plus tax if the line is taxable, rounded half-up **once per line**. Totals are the sum of the lines, so nothing is silently rounded. The UI always recomputes totals from the lines and never trusts a stored total. Checked by hand: 3 × $19.99 taxable + $0.10 taxable = **$64.28**.
- **Sales tax 7%** (demo default: Florida 6% + Miami-Dade 1% surtax), applied per line (services usually non-taxable, materials and furniture taxable). It is edited in **Settings → Taxes & billing**. Each estimate/invoice stores the rate it was created with (`tax_rate`), so a new rate only affects new documents and historical totals never change. Confirm the rate with the client's accountant.
- **Status flow.** Estimate: draft → sent → (viewed) → accepted / declined; expired is derived from the date. Invoice: draft → sent → partial → paid; overdue is derived when the due date has passed with a balance. "Convert to invoice" copies the lines into a new draft invoice linked to the estimate.
- **Payments** are their own records (amount, date, method, reference). A payment can't exceed the balance.
- **"Download PDF"** uses the browser's print to PDF with print-only CSS (letter size, only the document). A server-side PDF can replace it later without UI changes.
- **Reports.** Income = payments received in the range. Profitability is on an earned basis: billed − cost to date, with collected shown alongside as cash. Receivables aging buckets: not yet due, 1–30, 31–60, 61–90 and 90+ days. Accounts payable = expenses pending approval.
- The demo company details on documents are placeholders (example.com / 555 numbers) until the real company data is entered in Settings → Organization.

## AI module (demo)
- **No AI model or external API is called.** `services/aiService.js` returns deterministic, explainable heuristics over the CRM mock data, in the shape a real model or agent would return: keyword sentiment, topics, objections and opportunities; response times measured from message timestamps; seasonality, channel conversion and lifetime value (LTV) from leads and invoices. Each function is the swap point for a real endpoint (e.g. a Supabase Edge Function calling an LLM).
- Every AI screen shows a **"Demo data"** badge. Platform and ad-account connections are simulated: no credentials are requested or stored.
- Each module uses the same `AiModuleShell`: Results · Configure · Run history, plus **Run now** with simulated progress. The view lives in the URL (`?view=`).
- The assistant is intent matching (English and Spanish) over CRM data. Answers include deep links and suggested actions (open a filtered list, create an appointment…). It is available as a floating, non-blocking side panel on every screen and as a full page.
- Global AI preferences (assistant on/off, tone, reply language, data access, human review, schedule) live in **Settings → AI**. Turning the assistant off hides the floating button for everyone.

## iPhone / touch: the topbar never moves
- **No bounce.** `overscroll-behavior-y: none` on html/body (iOS Safari 16+, Chrome) stops the elastic scroll and the browser's pull-to-refresh, which dragged the whole page down, topbar included.
- **Fixed topbar on phones and tablets** (<1024px): `position: fixed` + `.main { padding-top: var(--topbar-h) }`, because a sticky bar can still move with iOS' elastic scroll. Desktop keeps `sticky`. The page still scrolls on the document (not an inner scroller), so Back/scroll restoration, sticky table headers and anchors keep working. The topbar background is solid on phones (backdrop blur stutters on iOS).
- **Our own pull-to-refresh** (`hooks/usePullToRefresh.js`, touch only): the content slides down under the still topbar, a spinner appears, and releasing past the threshold reloads the page. It does not start inside scrolled lists or threads, modals, the open drawer, or on sideways swipes. It respects *reduce motion*.
- **Safe areas** (`viewport-fit=cover` + `--safe-*` tokens): the notch in landscape and the home indicator are respected by the topbar, drawer, content, bottom sheets, floating AI button, save bar, toasts and update card.
- **`100dvh`** instead of `100vh` (with fallback) for full-height layouts and modal heights. On iPhone `100vh` is taller than the visible area.
- **No zoom on focus:** fields are 16px on iOS only (Safari zooms into inputs under 16px).
- **PWA on iPhone:** apple-touch-icon 180, `apple-mobile-web-app-*` metas, status bar `default`, and **launch screens for 10 iPhone sizes** (`npm run splash` → `public/splash`). iOS ignores the manifest's background color, so without them the app opens on a white screen. They are not precached: iOS reads them itself. Notifications on iPhone need iOS 16.4+ and the app added to the Home Screen (the "This device" card explains it).

## Sign in / sign out (mock auth)
- `/login` and `/forgot-password` sit outside the app shell. Every app route is protected (`RequireAuth`): a signed-out visitor goes to `/login?next=<page>` and comes back to the same page (with its filters) after signing in. Only same-app paths are accepted in `next` (no open redirects).
- **Demo accounts**: five fictional teammates, one per role, all with the password `demo1234`. They are listed in `docs/DEMO_ACCOUNTS.md`, **not on the sign-in screen**, so the login looks exactly as it will in production. Signing in as Owen (accounting) or Mia (viewer) shows real role permissions, not just the "view as" preview.
- "Keep me signed in" stores the session in localStorage (30 days); otherwise sessionStorage (closes with the tab, max 12 h). Sign out clears it and shows "You've signed out" with the email kept.
- Errors are explicit and never reveal whether an email exists. After 5 wrong attempts sign-in locks for 30 s. Password reset always answers the same way.
- `authService` has the contract of the real one (Supabase Auth or REST). See **`docs/API_INTEGRATION.md`**, the guide for wiring every service to a real backend.

## Settings module
- **One page per section** (`/settings/:section`), listed in the Settings ribbon like any other module. Sections with many fields are pages, short create/edit actions (invite user, catalog item, template) are modals — same rule as the rest of the app.
- **Save pattern.** Editable sections use one `SettingsForm`: nothing is saved until **Save changes** in a sticky bar that only appears when there are changes; *Discard* restores the last saved values; leaving with unsaved changes asks first. List-type actions (role change, connect/disconnect, add catalog item, approve template) apply immediately with a toast, because they are single, reversible actions.
- **Permissions.** Matrix of module × role with three levels: *no access*, *view*, *full*. Admin is always full. Default matrix:

  | Module | Admin | Designer | Accounting | Viewer |
  |---|---|---|---|---|
  | Dashboard | full | full | full | view |
  | CRM | full | full | view | view |
  | Projects | full | full | view | view |
  | Finance | full | view | full | none |
  | AI | full | full | view | none |
  | Settings | full | view | view | none |

  In phase 1 the UI enforces *no access* (module page replaced by a "No access" state, AI assistant hidden) and *view* for Settings (read-only form). Hiding create/edit buttons per role in every module, and the real enforcement, come with the backend (Supabase RLS reading the same matrix). The navigation keeps showing every module so the team learns where things are; blocked ones explain why.
- **"View as role"** is a demo/QA tool: it changes the role for this browser tab only (sessionStorage) and shows a banner with a way back. With real auth it becomes an admin-only "preview as" feature.
- **Brand color.** Six presets that pass WCAG AA with white text, plus a custom hex with a live contrast check. Hover/strong/soft shades are derived (`src/lib/color.js`) and written as the same CSS variables as `tokens.css`; in dark theme the color is lightened until it keeps 4.5:1. The default olive is never overridden.
- **Theme.** Light / dark / match system per user, remembered on the device. Dark uses the token overrides already in `tokens.css`.
- **Templates.** WhatsApp templates follow Meta's rule: new or edited templates are "In review" and only approved ones appear in the composer (approval is simulated with *Mark approved (demo)*). Variables: `{first}`, `{date}`, `{number}`, `{project}`.
- **Integrations.** No credentials are entered or stored anywhere in the demo. Supabase, QuickBooks, Stripe and DocuSign are listed as *Phase 2* so the backend can be designed with them in mind.
- Settings live in memory like all mock data: a page reload restores the defaults (theme and ribbon state are the only things remembered per browser).

## PWA (installable app)
- Built with `vite-plugin-pwa` (Workbox). The service worker **precaches the app shell, every JS/CSS chunk, icons and the Latin font files** (~1.7 MB), so after the first visit the CRM opens instantly and fully offline (phase 1 data is bundled). Other font subsets are cached on first use. `/health` is excluded from the SPA fallback.
- **Updates are prompted, never forced** (`registerType: 'prompt'`): a card offers *Reload* so nobody loses a half-filled form. Open tabs check for a new deploy every hour.
- **Manifest**: standalone display, brand colors (`#0F172A` theme, `#F8FAFC` background), 192/512 icons + a maskable icon with a 20% safe zone, Apple touch icon, shortcuts (New lead, WhatsApp, Agenda, New estimate) and wide/narrow screenshots for the richer install dialog. Icons are generated from the brand wordmark ("G." in Work Sans with the olive-gold dot).
- **Install button**: the browser's `beforeinstallprompt` is captured early (`src/app/pwa.js`) and exposed as *Install app* in the user menu and in Settings → My profile → This device. iOS has no install API, so it shows the Safari "Add to Home Screen" steps instead.
- **Notifications**: phase 1 only asks for permission and can show a local test notification. Real push (new lead, new WhatsApp message) needs a push server with VAPID keys — phase 2, on the backend.
- **Offline data in phase 2**: once Supabase is connected, API calls are network-first; offline writes (e.g. notes from a site visit) would need a queue (Workbox background sync). Not built in phase 1.
- **Installed on Windows / macOS / Linux, the title bar is part of the app** (`display_override: window-controls-overlay`). The minimize/maximize/close buttons are drawn over the top-right corner (top-left on macOS), so the app's title bar reserves that space using `env(titlebar-area-*)` and never puts the user menu under them (on macOS the history buttons move right). Empty parts of the title bar drag the window, and the window's title-bar color is the same graphite. The chevron in the title bar switches back to a classic title bar.
- Caddy serves `sw.js` and the manifest with `no-cache` (so updates are detected) and the CSP allows `worker-src 'self'` and `manifest-src 'self'`.

## Deployment
- Railway + **Railpack**: Vite is auto-detected and served as a static SPA by Caddy. The custom `Caddyfile` keeps Railpack's defaults (JSON logs, trusted Railway proxy, `/health`, compression) and adds caching rules and security headers.
- The CSP is strict (`'self'` only) because phase 1 makes no external calls. `style-src` allows `'unsafe-inline'` because React inline `style` attributes are used. It was verified on all 26 routes with no CSP violations.
- `X-Robots-Tag: noindex` keeps the demo out of search engines. Remove it at launch.
- No `railway.json`: Railway's Config as Code is deprecated for new services, so the healthcheck path is configured in the dashboard (see DEPLOY.md).

## Assumptions
- Single organization ("Demo Company"). The org switcher is present but only lists one org.
- Roles: admin, designer, accounting, viewer. The demo user (Tessa Monroe) is admin; Mia Delgado is a viewer so every role has a person.
- The UI language is English. `es.js` mirrors every key and is switchable from the user menu.
- React 18.3 + React Router 6.30 + Vite 6 are used as stable, widely supported versions.
