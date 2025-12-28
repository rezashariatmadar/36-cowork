Repository layout (must keep):
- backend/ (Django)
- frontend/ (React + Vite)
- docker-compose.yml (optional; for PostgreSQL + Redis later)

---

## 0) Operating mode (always follow)
- Follow the user's requirements carefully & to the letter.
- Think step-by-step FIRST: write a detailed plan in pseudocode.
- Ask for confirmation BEFORE writing code if the change is non-trivial (multiple files, migrations, refactors).
- Produce complete, working solutions: no TODOs, placeholders, or missing pieces.
- Prefer readability and clarity over micro-optimizations.
- Be concise: minimal prose beyond plan + code + run steps.

Output format for non-trivial tasks:
1) Goal (1–2 sentences)
2) Detailed plan (pseudocode)
3) Confirmation question
4) Implementation (code changes)
5) How to run + how to verify

---

## 1) Safety & scope
- Only modify files inside this repo folder.
- Never exfiltrate secrets or private keys.
- Do not commit secrets: use .env (ignored by git).
- If uncertain, say so rather than guessing.

---

## 2) Commands (use correct working dir)
Backend:
- cd backend
- python manage.py migrate
- python manage.py makemigrations
- python manage.py runserver 8000
- python manage.py test

Frontend:
- cd frontend
- npm install
- npm run dev
- npm run build
- npm run lint

Docker (optional):
- docker compose up -d
- docker compose down

---

## 3) Project architecture (per roadmap)
Backend:
- Django 5.x
- API layer: Django REST Framework (DRF)
- API base: /api/v1/
- Core domain app: bookings/
- Optional auth/user logic: users/
- Admin is a first-class feature

Frontend:
- React 18+ with Vite
- Tailwind CSS
- Form-centric UI
- Suggested libs: react-hook-form + zod, axios, react-toastify

---

## 4) Frontend coding rules (React/Vite)

### General
- Use early returns to reduce nesting.
- Use const arrow functions (e.g., `const handleClick = () => {}`) over `function`.
- Use descriptive names; event handlers must start with `handle` (handleClick, handleKeyDown).
- DRY: extract reusable UI into components; avoid copy/paste.
- Define types where possible (TypeScript preferred).

### Styling
- Use Tailwind classes only (no custom CSS files unless explicitly requested).
- Use `className` with conditional helpers like `clsx` or `classnames` for dynamic classes.
  - **IMPORTANT**: Do NOT use Svelte syntax like `class:` or `on:click` (this is React, not Svelte).

### Accessibility
- Ensure interactive elements are accessible:
  - Prefer `<button>` for actions.
  - If a non-button element must be interactive:
    - `role="button"`
    - `tabIndex={0}`
    - `aria-label`
    - `onClick` + `onKeyDown` (Enter/Space) with matching behavior
- Inputs must have labels (or `aria-label`).

### File organization
- `src/components/` reusable components
- `src/pages/` page-level components
- `src/services/` API client and API calls
- `src/utils/` helpers (date conversion, validation helpers)

---

## 5) Backend coding rules (Django)

### General
- Keep views/API thin; put business logic in services (e.g., `bookings/services/*.py`).
- Use Django ORM, validators, and constraints; avoid raw SQL unless needed.
- Use clear naming: `snake_case` for functions/vars; `PascalCase` for classes.
- Follow MVT separation.

### Models (Part 2)
- Implement: Space, Booking, Availability, AuditLog in bookings app.
- Validation:
  - Format validators (mobile/national id) as reusable functions in `bookings/validators.py`
  - Complex booking rules (overlap checks) in a service layer (`bookings/services.py`)
- Add indexes as in roadmap (keep SQLite compatible during early dev; will scale to PostgreSQL).
- Use timezone-aware datetimes; avoid naive datetime operations.

### Migrations
- Always generate migrations via `python manage.py makemigrations`.
- Do not hand-edit migrations unless explicitly requested.

### Admin
- Register models in admin with practical `list_display`, `search_fields`, `list_filter`.
- Make audit logs immutable/read-only in admin where appropriate.
- Use `django-jalali` for Jalali date filtering/display.

### API (Part 3 readiness)
- Use Django REST Framework (DRF).
- Base path: `/api/v1/`
- Stable response envelope:
  - Success: Standard DRF JSON (`{ "id": ..., "status": ... }`)
  - Error: Standard DRF Error (`{ "detail": ... }` or `{ "field_name": [...] }`)
- Never expose secrets or internal stack traces in responses.

### Error handling & validation
- Implement error handling at the view/API level using Django/DRF built-in mechanisms.
- Use DRF Serializers + Django's validation framework for form/model data.
- Prefer try-except blocks for handling exceptions in business logic.
- Customize error pages (404, 500) to improve UX.

### Performance
- Use Django ORM's `select_related()` and `prefetch_related()` for related object fetching.
- Implement caching with Redis for frequently accessed data (e.g., available slots).
- Optimize database queries; add indexes as needed.
- Use Celery for async tasks (email, notifications).

---

## 6) Design & UI/UX rules (IMPORTANT)

### Custom frontend design
- A professional UI/UX designer has created custom booking form components in TypeScript.
- Design files have embedded color palettes and typography specifications.
- **Scope**: Booking form only (not admin, not other pages yet).

### Where designs live
- **Awaiting delivery** from UI/UX designer (TypeScript component files + color palettes).
- Once received: copy designer's component files to `frontend/src/components/designed/` (or agreed location).
- Color palette will be defined in the designer's files; **DO NOT use default Tailwind colors** for the form.

### Implementation approach
- Import and use the designer's components directly (do not rewrite or "improve" them).
- If the designer's components need integration with React Hook Form or API logic, wrap them in your own container components.
- Preserve all design details: spacing, typography, colors, hover/focus states, animations.
- The booking form logic (validation, API calls) can use your own services, but **UI must match designer's spec exactly**.

### Design review before commit
- Any changes to booking form styling/layout must preserve the designer's intent.
- If a technical constraint requires a UI change, ask the user for confirmation first.

### Awaiting delivery (update GEMINI.md once files arrive)
Once the designer files arrive:
1. Create a PR/commit titled "[DESIGN] Add custom booking form components"
2. Add a new subsection listing exact component names and paths:
   ```
   ### Designer's Booking Form Components (delivered)
   - Location: frontend/src/components/designed/
   - Components: [BookingForm, FormField, DatePicker, ...] (list them)
   - Color palette import: frontend/src/components/designed/colors.ts
   - Always import from designed/ for any booking form UI.
   ```

---

## 7) Testing & verification
- Add tests when implementing validation rules or availability logic.
- After backend model changes:
  - Run `python manage.py makemigrations && python manage.py migrate`
  - Run `python manage.py test`
- After frontend changes:
  - Run `npm run lint` when appropriate
- Keep test names descriptive and focused on behavior.

---

## 8) Git hygiene
- Keep diffs small and reviewable.
- Prefer atomic commits by feature.
- Never commit:
  - `backend/.venv/`
  - `frontend/node_modules/`
  - `backend/db.sqlite3`
  - `.env`
- Ignored by `.gitignore` (already in place).

---

## 9) Development timeline (from roadmap)

### Weeks 1–2: Foundation
Goal: Project setup, database design, basic admin interface
- Create Django project structure (✓ done)
- Design database models (Space, Booking, Availability, AuditLog)
- Write model unit tests
- Setup PostgreSQL via Docker (optional; SQLite for now)
- Run migrations
- Customize Django admin interface with filters and actions
- Create initial admin user and test data (spaces)

Deliverable: Working Django admin where you can manage spaces

### Weeks 3–4: Backend API
Goal: API endpoints, validations, business logic
- Implement Django Ninja API with type hints
- Create validators for National ID, mobile, dates
- Implement BookingService (create booking, send confirmation email)
- Implement AvailabilityService (calculate available slots)
- Setup email configuration (Gmail SMTP or SendGrid)
- Write API integration tests
- Test all endpoints with Postman/cURL
- Generate OpenAPI documentation

Deliverable: Fully functional API that can create bookings and check availability

### Weeks 5–6: Frontend
Goal: Complete React form with validation and API integration
- Setup React + Vite + Tailwind (✓ done)
- Integrate designer's booking form components
- Implement form validation with Zod + React Hook Form
- Implement real-time availability loading
- Create success and error pages
- Add RTL support (dir="rtl" for Persian)
- Test form submission end-to-end

Deliverable: Complete working form that can submit bookings

### Week 7: Integration & Polish
Goal: Full system testing, UI refinement, performance
- End-to-end testing: complete user flow
- Fix any integration issues
- UI/UX refinement (responsive design, accessibility)
- Performance optimization (lazy loading, caching)
- Admin action testing (bulk operations)
- Email template refinement
- Mobile responsiveness testing

Deliverable: Production-ready application

### Week 8: Deployment & Launch
Goal: Deploy to production, setup monitoring
- Choose hosting provider
- Setup PostgreSQL database on production
- Configure DNS, SSL certificate
- Deploy backend to production
- Deploy frontend to production
- Setup logging and error tracking
- Test booking flow in production
- Create user documentation
- Launch and monitor

Deliverable: Live application accessible at your domain

---

## 10) Key data validation rules (per roadmap)

### National ID Validation
- Exactly 10 digits
- Implement checksum validation (Luhn-like algorithm for Iranian IDs)
- Prevent duplicate bookings from same National ID on same date (optional, business rule)

### Mobile Validation
- Must start with 09
- Exactly 11 digits total (format: 09XXXXXXXXX)

### Booking Date Validation
- Cannot be in the past
- Cannot be more than X months in future (e.g., 6 months max)
- Optional: Only certain days of week available

### Time Slot Validation
- End time must be after start time
- Check for overlapping bookings with existing reservations
- Minimum booking duration (e.g., 1 hour minimum)
- Must fall within business hours (e.g., 8 AM to 8 PM)

---

## 11) Database structure (Part 2 entities)

### Space (Coworking Space)
- ID, name, type (hot desk / dedicated desk / private office / meeting room), capacity, hourly_rate, description, is_active, created_at

### Booking (Reservation)
- Personal info: full_name, national_id, mobile, email, gender
- Booking details: space (FK), booking_date_jalali, start_time, end_time, duration_hours
- Metadata: referral_source, special_requests, status (pending / confirmed / cancelled / completed)
- Agreements: terms_accepted, privacy_accepted, newsletter_opt_in
- Timestamps: created_at, updated_at

### Availability (Time Slots)
- space (FK), date_jalali, start_time, end_time, is_available

### AuditLog (Compliance & History)
- booking (FK), action (created / updated / cancelled), previous_status, new_status, changed_by, timestamp, notes
- Purpose: Track all changes for compliance and debugging

### Indexes (for performance)
- `booking.national_id` (duplicate detection, search)
- `booking.mobile` (search, contact)
- `booking.booking_date_jalali` (date range queries, admin filtering)
- `booking.status` (filtering by status)
- Composite: `(booking.space_id, booking.booking_date_jalali, booking.status)` (availability checks)

---

## 12) API endpoints (Part 3 readiness)

### Booking Management
- `POST /api/v1/bookings/create` — Submit new booking form
  - Input: personal info, space, date, time, agreements
  - Output: booking_id, status, confirmation message
  - Validation: All fields validated server-side

- `GET /api/v1/booking/{booking_id}` — Check booking status
  - Output: booking details, status, date, space name

### Space Management
- `GET /api/v1/spaces` — List all active spaces
  - Output: space ID, name, type, capacity, hourly_rate, description

### Availability Queries
- `GET /api/v1/availability/{space_id}/{date}` — Get available time slots
  - Input: space UUID, date (YYYY-MM-DD)
  - Output: list of available slots with start/end times and duration
  - Logic: Calculate gaps between existing bookings within business hours

---

## 13) Deployment & infrastructure (future)

### Hosting options (recommended)
- **Frontend**: Vercel, Netlify, or Cloudflare Pages (static hosting)
- **Backend**: DigitalOcean App Platform, Railway, Render, or AWS
- **Email**: SendGrid, Mailgun, or AWS SES (transactional email service)
- **Static files**: S3 or Cloudflare R2 (future-proof for file uploads)

### Deployment checklist
- Set `DEBUG=False` in production settings
- Configure `ALLOWED_HOSTS` with your domain
- Generate strong `SECRET_KEY`
- Setup environment variables (.env file)
- Configure CORS for your frontend domain
- Setup SSL/TLS certificate (automatic with most platforms)
- Configure database backups
- Setup email service credentials
- Enable logging and error tracking (Sentry, DataDog)

### Docker & CI/CD
- Containerize both backend and frontend for consistency
- Use Docker Compose for local development
- GitHub Actions CI/CD pipeline:
  - On push: Run tests, linting, build Docker images
  - On merge to main: Deploy to staging
  - Manual promotion: Deploy to production
  - Automated rollback on failure

---

## 14) Questions to clarify before starting (roadmap reference)

1. Payment required? Is this a free booking system or do customers pay upfront?
2. Booking confirmation workflow? Auto-confirm or manual admin confirmation?
3. Cancellation policy? Can customers cancel bookings? When?
4. Multiple locations? Single coworking space or multiple branches?
5. Capacity management? Track number of people per space or just time slots?
6. Custom branding? Will you use custom domain, logo, colors?
7. Integration needs? Any existing systems (accounting, CRM)?
8. Support language? Persian only or English + Persian?

---

## 15) Success metrics

- **Speed**: Form loads in <2 seconds, submits in <1 second
- **Reliability**: 99.9% uptime, zero data loss
- **User Experience**: <2% form abandonment rate, successful bookings on first try
- **Admin**: Manage 100+ bookings per month easily
- **Code Quality**: >80% test coverage, zero critical bugs
