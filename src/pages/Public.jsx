import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { post } from "../api";
import { auth } from "../auth";
import { roleHome } from "../roles";
import { ErrorBox, Field, Icon, Logo } from "../components/ui";

/* ---------- Landing ---------- */
export function Home({ user }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  if (user) return <Navigate to={roleHome(user.role)} replace />;

  function go(e) {
    e.preventDefault();
    navigate("/attempt", { state: { room_code: code.trim().toUpperCase() } });
  }

  return (
    <div data-role="PUBLIC" className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/register" className="btn-secondary btn-sm hidden sm:inline-flex">Create student account</Link>
          <Link to="/login" className="btn-primary btn-sm">Sign in</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <section>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Online exams, from question bank to result.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Examiners build and publish exams, students take them in a focused workspace, and scores are calculated the moment an attempt is submitted.
          </p>
          <p className="mt-8 text-sm text-slate-500">
            Have an account? Sign in and ExamForge opens the workspace for your role: student, examiner or admin.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-canvas p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Take an exam</h2>
          <p className="mt-1 text-sm text-slate-500">Enter the room code from your examiner. No account needed for common exams.</p>
          <form onSubmit={go} className="mt-6 space-y-4">
            <Field label="Room code">
              <input className="input text-base font-semibold uppercase tracking-wider" required placeholder="e.g. PYTHON26X" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </Field>
            <button className="btn-primary w-full">Continue <Icon name="arrowRight" className="h-4 w-4" /></button>
          </form>
        </section>
      </main>
    </div>
  );
}

/* ---------- Shared auth card ---------- */
function AuthCard({ title, subtitle, children }) {
  return (
    <div data-role="PUBLIC" className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Have an exam room code? <Link className="font-semibold text-accent-700 hover:underline" to="/attempt">Take an exam</Link>
        </p>
      </div>
    </div>
  );
}

export function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navg = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await auth.login(form.email, form.password);
      onLogin(u);
      navg(roleHome(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Sign in" subtitle="Students, examiners and admins all sign in here.">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="text-center text-sm text-slate-500">
          New student? <Link className="font-semibold text-accent-700 hover:underline" to="/register">Create an account</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", student_id: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.register({ ...form, student_id: form.student_id || null, phone: form.phone || null });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthCard title="Account created" subtitle="Your student account is ready.">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Sign in to join batches, take batch exams and keep your attempt history.</p>
          <Link className="btn-primary w-full" to="/login">Continue to sign in</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create a student account" subtitle="Registration is for students. Staff accounts are set up by an admin.">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Full name">
          <input className="input" required autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student ID (optional)">
            <input className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} />
          </Field>
          <Field label="Phone (optional)">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="text-center text-sm text-slate-500">
          Already registered? <Link className="font-semibold text-accent-700 hover:underline" to="/login">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}

/* ---------- Room-code entry for common exams ---------- */
export function RoomAttempt() {
  const location = useLocation();
  const [form, setForm] = useState({ room_code: location.state?.room_code || "", candidate_name: "", candidate_email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navg = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const a = await post("/exam-attempts/common", form);
      navg(`/attempt/${a.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-role="PUBLIC" className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink"><Icon name="arrowLeft" className="h-4 w-4" /> Back</Link>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Enter exam room</h1>
          <p className="mt-1 text-sm text-slate-500">Use the room code your examiner gave you. The timer starts as soon as you begin.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            {error && <ErrorBox>{error}</ErrorBox>}
            <Field label="Room code">
              <input className="input font-semibold uppercase tracking-wider" required value={form.room_code} onChange={(e) => setForm({ ...form, room_code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Your name">
              <input className="input" required autoComplete="name" value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} />
            </Field>
            <Field label="Your email">
              <input className="input" type="email" required autoComplete="email" value={form.candidate_email} onChange={(e) => setForm({ ...form, candidate_email: e.target.value })} />
            </Field>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Starting…" : "Start exam"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
