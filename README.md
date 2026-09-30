# ExamForge Frontend

Clean React + Tailwind frontend for the current ExamForge FastAPI backend.

## Requirements
- Node.js 20+
- ExamForge backend running on `http://127.0.0.1:8000`

## Start

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

The API base URL is controlled by:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For a different backend host/port, change only that variable.

## Architecture

- React + Vite
- Tailwind CSS
- React Router
- Native `fetch`
- No Axios
- API calls centralized in `src/api.js`

The frontend uses the backend routes directly; it does not create substitute endpoints.

## Project structure

```
src/
  main.jsx              entry point
  App.jsx               routes and route guards
  api.js, auth.js       unchanged: fetch wrapper and login/logout
  config.js             unchanged: VITE_API_BASE_URL
  roles.js              role -> home route, current workspace prefix
  index.css             design tokens, per-role accent colours, button/input styles
  components/
    ui.jsx              icons, badges, form fields, modals, toasts, empty states
    layouts.jsx         StaffLayout (admin + examiner) and StudentLayout
  pages/
    Public.jsx          landing, sign in, register, room-code entry
    Candidate.jsx       exam-taking screen and result
    Student.jsx         student dashboard, attempts, batches
    Exams.jsx           staff overview, exam list/editor, exam questions, results
    Questions.jsx       question bank, editor, import
    Batches.jsx         batch management (admin)
```

## Workspaces

Each role has its own layout, navigation and accent colour (set by `data-role`).

| Role | Layout | Accent | Navigation |
| --- | --- | --- | --- |
| Admin | Dark sidebar, "Admin console" | Indigo | Overview, Exams, Question bank, Batches |
| Examiner | Light sidebar, "Examiner workspace" | Teal | Overview, Exams, Question bank |
| Student | Top navigation | Blue | Dashboard, My attempts, My batches |
| Candidate | Focused exam screen, no navigation | Blue | none |

## Main flows

Public: landing, student registration, login, common exam by room code.
Student: dashboard, attempts, batches, taking an exam, result.
Admin / Examiner: overview, exam lifecycle, exam questions and scoring, question bank, import, results. Admin also manages batches.

## CORS

The supplied backend already contains FastAPI CORSMiddleware for:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Keep the frontend on port 5173 during local development unless the backend CORS origins are updated too.

## Verified backend constraints

The supplied backend does **not** expose `GET /api/exams/{exam_id}`. The frontend therefore loads `/api/exams` and selects the requested exam by ID.

The supplied backend also does not expose a student endpoint that lists exams available through batch membership. The frontend does not invent one.

For common room-code attempts, the backend permits reading `/student-exams/{attempt_id}/questions` without a JWT, but the current attempt ownership helper requires a user for the general `/exam-attempts/{attempt_id}/result` endpoint. The frontend therefore uses the submit response for the immediate common-exam result and stores it in session storage for that result screen.
