# Scholarship Foundation — Scholarship & Volunteer Portal

A complete **MERN stack** web application for a non-profit organisation that provides scholarships to
**school students** and **university students**, and runs **O/L seminars, paper classes, workshops and
community programmes** that volunteers can join.

The system has two separate portals with **role based access control**:

| Portal | Who signs in | What they can do |
| --- | --- | --- |
| **User (student / volunteer)** | Students & volunteers | Register, apply for scholarships (6-step form + document upload), track verification status, view future events, submit a volunteer registration form, receive email + in-app notifications |
| **Admin** | Organisation staff | Create / update / delete scholarships and events, verify applications (approve / reject / under review), see today's applications, manage volunteers, students and staff accounts, email students, inspect the email outbox |

---

## 1. Tech stack

| Layer | Technology |
| --- | --- |
| **M**ongoDB | MongoDB + Mongoose (inspect with **MongoDB Compass**) — with an automatic file-backed dev store when no MongoDB server is running |
| **E**xpress | Express 4 REST API, JWT auth, bcrypt password hashing, multer file uploads, nodemailer email |
| **R**eact | React 18 + Vite, React Router 6, Axios, hand-written CSS design system |
| **N**ode | Node 18+ |

Other pieces: role-based middleware (`admin` / `student`), branded HTML email templates, CSV export,
paginated admin tables, filter bars and a purple/gold brand theme inspired by
[leapfoundation.lk](https://www.leapfoundation.lk/).

---

## 2. Quick start

```bash
# 1. install everything (root, server and client)
npm run install:all

# 2. configure the server
cp server/.env.example server/.env        # then edit if needed

# 3. start MongoDB (see section 3) and seed the demo data
npm run seed

# 4. run API + client together
npm run dev
```

* Website (React)  →  <http://localhost:5173>
* API (Express)    →  <http://localhost:5000/api>
* Health check     →  <http://localhost:5000/api/health>

### Demo accounts (created by `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| **Administrator** | `admin@scholarship.org` | `Admin@123` |
| **Student 1** | `student@example.com` | `Student@123` |
| **Student 2** | `kavindi@example.com` | `Student@123` |
| **Student 3** | `rifhan@example.com` | `Student@123` |
| Volunteers / more students | `tharshini@example.com`, `sanduni@example.com` | `Student@123` |

The sign-in page lists them and can auto-fill the form for you.

---

## 3. Running against MongoDB (with MongoDB Compass)

By default `DB_MODE=auto`: the API tries MongoDB first and, **if no MongoDB server is running, falls back
to a built-in JSON-file dev store** so the app always starts. The admin dashboard tells you which one is
active (Admin → System → Database).

To use the real MongoDB (recommended for your project submission):

1. Start a MongoDB server locally — either install **MongoDB Community Server** (`mongod`), start the
   server from **MongoDB Compass**, or run Docker:
   ```bash
   docker run -d -p 27017:27017 --name scholarship-mongo mongo:7
   ```
2. In `server/.env` set:
   ```
   DB_MODE=mongo
   MONGODB_URI=mongodb://127.0.0.1:27017/scholarship_portal
   ```
3. Seed the demo data (it is skipped automatically if data already exists):
   ```bash
   npm run seed            # add --reset to wipe the collections first
   ```
4. Open **MongoDB Compass** and connect to `mongodb://127.0.0.1:27017`. The database
   **`scholarship_portal`** contains these collections:

   | Collection | Contents |
   | --- | --- |
   | `users` | Student and admin accounts (bcrypt password hashes) |
   | `scholarships` | School & university scholarship programmes and their rules |
   | `events` | Seminars, paper classes, workshops, volunteer roles |
   | `applications` | Full submitted scholarship applications (personal, guardian, education, financial, motivation, documents, admin review) |
   | `volunteers` | Volunteer registrations per event |
   | `notifications` | In-app notifications per user |
   | `emails` | Email outbox — every notification email the system generated |
   | `counters` | Sequence counters used for `APP-2026-00001` / `VOL-2026-00001` references |

---

## 4. What was built — feature list

### 4.1 User area (student / volunteer)

* **Registration & login** — name, email, password, NIC (validated: 9 digits + V/X or 12 digits),
  Sri Lankan mobile number and district. Students only; admins are created by other admins.
* **Scholarship application form** — a 6-step wizard with per-step validation, a live summary panel and
  document upload:
  1. Scholarship & applicant type (school student / university student)
  2. Personal details (name, NIC, DOB, gender, email, phone, WhatsApp, address, district, DS division)
  3. Guardian & household (guardian income, family members, income sources, Samurdhi / state support)
  4. Education & results (school details + O/L subject/grade rows **or** university, programme, year,
     GPA + A/L subject/grade rows, achievements, leadership, extracurriculars, preferred field of study)
  5. Financial need & motivation (amount requested, purpose, bank details, why you need it, family
     situation, goals, community contribution)
  6. Documents (NIC copy, results sheet, income proof, recommendation letter, other certificates) &
     signed declaration
* **My applications** — cards + full detail view with the complete verification history timeline.
* **Events & volunteering** — browse upcoming **and past** events (future events are published by the
  admin), filter by type/district and submit the **volunteer registration form** (personal details, NIC,
  preferred role, availability, experience, motivation, emergency contact, declaration).
* **My volunteer records** — status of every registration (pending / confirmed / declined) with notes
  from the coordinators.
* **Notifications** — in-app list with unread badge in the navbar, mark as read / mark all / delete.
* **Profile & password** — update contact details, change password.

### 4.2 Admin area

* **Dashboard** — applications received **today** (with a date picker to look at any day), pending /
  approved / rejected totals, 6-month application trend chart, status breakdown meters, latest
  applications, upcoming events, volunteers awaiting approval, and a live warning when MongoDB is not
  connected.
* **Applications** — search by reference/name/NIC/email/phone, filter by status, applicant type,
  scholarship, district and submission date, pagination, **CSV export**, and a verification modal
  (status + note + notify toggle).
* **Application detail** — every submitted field, uploaded documents (open in a new tab), internal
  admin note, verification history, and one-click **Approve / Under review / Reject**. Approving or
  rejecting **emails the student automatically** with a branded template.
* **Scholarships** — create, update, close/reopen and delete programmes (title, category, status,
  award value, deadlines, seats, eligibility, benefits, required documents, eligible districts,
  contact details, featured flag).
* **Events** — create, update, delete, publish/draft, email all students about an event, and view the
  volunteers registered for each event.
* **Volunteers** — approve or decline registrations (student is emailed), search and filter by event.
* **Students / Accounts** — list every account with application counts, activate/deactivate, reset
  passwords and create new **administrator** accounts (role based access).
* **Email outbox** — every notification email is stored and can be previewed (exact HTML the student
  received) and re-sent; SMTP can be switched on in `.env` at any time.
* **Send announcement** — broadcast an email + in-app notification to all students.
* **System** — database mode, connection string, mail transport, organisation details, live counters
  and step-by-step instructions to switch to MongoDB.

---

## 5. Project structure

```
.
├── server/                     # Express + Mongoose API
│   ├── src/
│   │   ├── config.js           # env-driven configuration
│   │   ├── app.js              # express app, routes, error handling
│   │   ├── index.js            # boot: database → seed → listen
│   │   ├── db/                 # MongoDB (mongoose) + in-memory dev backend
│   │   ├── models/constants.js # districts, streams, statuses, document types
│   │   ├── repos/              # data access layer (one module per collection)
│   │   ├── routes/             # auth, meta, scholarships, events, applications,
│   │   │                       # volunteers, notifications, admin
│   │   ├── services/           # application form validation, emails, stats, notifications
│   │   ├── middleware/         # JWT auth + role guard, multer uploads
│   │   └── seed/seed.js        # demo data (scholarships, events, applications, volunteers)
│   └── .env.example
├── client/                     # React + Vite front end
│   └── src/
│       ├── api/client.js       # axios instance + typed API helpers
│       ├── context/            # auth, site metadata, toasts
│       ├── components/         # layout shells, UI kit, cards, nav
│       ├── pages/public/       # home, about, scholarships, events, contact, login, register
│       ├── pages/student/      # dashboard, apply wizard, applications, volunteering, notifications
│       ├── pages/admin/        # 13 admin screens
│       └── styles/             # design tokens + component CSS
└── package.json                # npm run dev (API + client together)
```

---

## 6. API overview

| Method & path | Access | Purpose |
| --- | --- | --- |
| `POST /api/auth/register` | public | Student self registration |
| `POST /api/auth/login` | public | Login (returns role for the correct portal) |
| `GET /api/auth/me` · `PATCH /api/auth/me` · `POST /api/auth/change-password` | signed in | Profile & password |
| `GET /api/meta` | public | Districts, streams, roles, document types, options |
| `GET /api/scholarships` · `GET /api/scholarships/:id` | public | Scholarship catalogue & detail |
| `POST/PATCH/DELETE /api/scholarships/:id` | admin | Create, update, delete programmes |
| `GET /api/events?scope=upcoming\|past` · `GET /api/events/:id` | public | Events (future & past) |
| `POST/PATCH/DELETE /api/events/:id` · `POST /api/events/:id/notify` | admin | Manage events, email students |
| `POST /api/applications` | student | Submit application (multipart + JSON payload) |
| `GET /api/applications/me[/:id]` | student | Own applications |
| `GET /api/applications/admin/list` · `/admin/today` · `/admin/stats` · `/admin/export` | admin | Lists, today's submissions, dashboard stats, CSV |
| `PATCH /api/applications/admin/:id/status` | admin | Approve / reject / review → **emails the student** |
| `POST /api/volunteers` · `GET /api/volunteers/me` | signed in | Volunteer registration form & records |
| `PATCH /api/volunteers/admin/:id/status` | admin | Confirm / decline → emails the volunteer |
| `GET/PATCH /api/notifications*` | signed in | In-app notifications |
| `GET /api/admin/stats` · `/system` · `/users` · `/emails` · `/broadcast` | admin | Dashboard, accounts, outbox, announcements |

---

## 7. Testing guide (suggested walkthrough)

1. **Sign in as the admin** (`admin@scholarship.org / Admin@123`) → the dashboard lists the applications
   submitted **today** (the seed creates two), the 6-month chart and volunteers awaiting approval.
2. **Sign in as a student** (`student@example.com / Student@123`) → *New application* → complete the six
   steps (attach any PDF/JPG as documents) → submit. The reference number is `APP-<year>-<serial>`.
3. **Back as admin** → *Applications* → open the new application → check the uploaded documents →
   **Approve** it with a note. The student is emailed instantly.
4. **Open Admin → Email Outbox** and preview the congratulations email — that is the exact message the
   student received (add SMTP credentials to `.env` to deliver mail for real).
5. **As the student** → *Notifications* (bell badge) and *My applications* show the approval.
6. **Volunteering** → *Events & sign-up* → pick an upcoming paper class → submit the volunteer form.
   **As admin** → *Volunteers* → **Confirm** it; the volunteer receives a confirmation email.
7. **Admin → Events → + New event** → tick *Email every student* to publish a future event and notify
   everyone; it then appears in the student portal and on the public events page.
8. **Admin → Scholarships** → create/close/delete programmes and watch them change on the public site.
9. **Admin → Send announcement** → broadcast a message and preview it in the outbox.
10. Switch to MongoDB (`DB_MODE=mongo`), re-run `npm run seed`, and browse the collections in
    **MongoDB Compass**.

---

## 8. Building for production

```bash
npm run build      # builds the React client into client/dist
npm start          # the Express server serves the API *and* client/dist on port 5000
```

Before going live:

* set a strong `JWT_SECRET` and change the seeded passwords,
* set `DB_MODE=mongo` with your production `MONGODB_URI`,
* configure real `SMTP_*` credentials so notification emails are delivered,
* review `server/uploads` storage (documents contain personal data) and your backup policy.

---

## 9. Notes

* **Email delivery** — with no SMTP host configured, the app runs in *Email Outbox* mode: every email is
  rendered, stored and previewable, so the complete approve/reject → notify workflow can be
  demonstrated during testing without a mail account.
* **File uploads** — PDF, JPG, PNG or WEBP, max 5 MB each (configurable with `MAX_UPLOAD_MB`).
* **Security** — passwords are bcrypt hashed, JWTs expire after 7 days, every admin route is protected by
  role middleware, and students can only read their own applications.
