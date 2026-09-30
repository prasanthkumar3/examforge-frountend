import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "../api";
import { EmptyState, ErrorBox, Field, Icon, PageHeader, Spinner, Stat, StatusBadge, Tabs, fmtDate, label } from "../components/ui";

function attemptTitle(a) {
  return a.exam_title ?? a.exam?.title ?? "Exam attempt";
}

function AttemptRow({ a }) {
  const submitted = a.status === "SUBMITTED";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{attemptTitle(a)}</span>
          <StatusBadge value={a.status} />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Attempt {a.attempt_number} · {label(a.access_method)} · {submitted ? `Submitted ${fmtDate(a.submitted_at)}` : `Started ${fmtDate(a.started_at)}`}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {submitted && <div className="text-right"><div className="text-xs text-slate-500">Score</div><div className="text-lg font-extrabold text-ink">{a.score ?? "—"}</div></div>}
        {submitted
          ? <Link className="btn-secondary btn-sm" to={`/attempt/${a.id}/result`}>View result</Link>
          : <Link className="btn-primary btn-sm" to={`/attempt/${a.id}`}>Continue</Link>}
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
export function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [availableExams, setAvailableExams] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
  get("/exam-attempts/my")
    .then(setItems)
    .catch((e) => {
      setError(e.message);
      setItems([]);
    });

  get("/api/exams/student/available")
    .then(setAvailableExams)
    .catch((e) => {
      setError(e.message);
      setAvailableExams([]);
    });
}, []);

  const list = items || [];
  const inProgress = list.filter((a) => a.status === "IN_PROGRESS").length;
  const submitted = list.filter((a) => a.status === "SUBMITTED").length;
  const firstName = (user.full_name || "").split(" ")[0];

  function start(e) {
    e.preventDefault();
    navigate("/attempt", { state: { room_code: code.trim().toUpperCase() } });
  }

  return (
    <div>
      <PageHeader title={`Hi ${firstName}`} subtitle="Start an exam, pick up where you left off, or check a result." />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={start} className="card p-6">
          <h2 className="text-base font-bold text-ink">Start an exam</h2>
          <p className="mt-1 text-sm text-slate-500">Enter the room code from your examiner.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input className="input font-semibold uppercase tracking-wider" required placeholder="Room code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="Room code" />
            <button className="btn-primary shrink-0">Start <Icon name="arrowRight" className="h-4 w-4" /></button>
          </div>
        </form>

        <div className="card p-6">
          <h2 className="text-base font-bold text-ink">Batch exams</h2>
          <p className="mt-1 text-sm text-slate-500">Join a batch with the code from your instructor to become eligible for its exams.</p>
          <Link to="/student/batches" className="btn-secondary mt-4"><Icon name="users" className="h-4 w-4" /> My batches</Link>
        </div>
      </div>

      <div className="mt-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-bold text-ink">
        Available batch exams
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Exams currently available through your active batches.
      </p>
    </div>
  </div>

  <div className="mt-4">
    {availableExams === null ? (
      <Spinner />
    ) : availableExams.length === 0 ? (
      <EmptyState
        title="No active batch exams"
        body="When an examiner publishes an active exam for one of your batches, it will appear here."
      />
    ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {availableExams.map((exam) => (
          <div key={exam.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-bold text-ink">
                  {exam.title}
                </h3>

                {exam.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {exam.description}
                  </p>
                )}
              </div>

              <StatusBadge value={exam.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>
                Duration: {exam.duration_minutes} min
              </span>

              <span>
                Max attempts: {exam.max_attempts}
              </span>
            </div>

            <div className="mt-4">
              <button
                className="btn-primary w-full"
                onClick={async () => {
                try {
                  setError("");

                  const attempt = await post(
                    `/exam-attempts/batch/${exam.id}`
                  );

                  navigate(`/attempt/${attempt.id}`);
                } catch (err) {
                setError(err.message);
                }
                }}
                >
                Start Exam
                <Icon name="arrowRight" className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Attempts" value={items === null ? "…" : list.length} />
        <Stat label="In progress" value={items === null ? "…" : inProgress} />
        <Stat label="Submitted" value={items === null ? "…" : submitted} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Recent attempts</h2>
        {list.length > 5 && <Link to="/student/attempts" className="text-sm font-semibold text-accent-700 hover:underline">View all</Link>}
      </div>
      <div className="mt-3">
        {items === null ? <Spinner /> : list.length === 0 ? (
          <EmptyState title="No attempts yet" body="When you start an exam it will show up here, so you can continue it or see your result." />
        ) : (
          <div className="card divide-y divide-line">{list.slice(0, 5).map((a) => <AttemptRow key={a.id} a={a} />)}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- My attempts ---------- */
export function MyAttempts() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL");

  useEffect(() => {
    get("/exam-attempts/my").then(setItems).catch((e) => { setError(e.message); setItems([]); });
  }, []);

  const list = items || [];
  const shown = tab === "ALL" ? list : list.filter((a) => a.status === tab);

  return (
    <div>
      <PageHeader
        title="My attempts"
        subtitle="Every exam you've started."
        actions={<Link to="/attempt" className="btn-primary btn-sm"><Icon name="plus" className="h-4 w-4" /> Start with room code</Link>}
      />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "ALL", label: "All", count: list.length },
          { value: "IN_PROGRESS", label: "In progress", count: list.filter((a) => a.status === "IN_PROGRESS").length },
          { value: "SUBMITTED", label: "Submitted", count: list.filter((a) => a.status === "SUBMITTED").length },
        ]}
      />
      <div className="mt-4">
        {items === null ? <Spinner /> : shown.length === 0 ? (
          <EmptyState title="Nothing here" body={tab === "ALL" ? "You haven't started any exams yet." : "No attempts match this filter."} />
        ) : (
          <div className="card divide-y divide-line">{shown.map((a) => <AttemptRow key={a.id} a={a} />)}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- My batches ---------- */
export function StudentBatches() {
  const [items, setItems] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try { setItems(await get("/api/batches/my")); } catch (e) { setError(e.message); setItems([]); }
  }
  useEffect(() => { load(); }, []);

  async function join(e) {
    e.preventDefault();
    try {
      setError("");
      await post("/api/batches/join", { code });
      setCode("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="My batches" subtitle="Batches you belong to decide which batch exams you can take." />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <form onSubmit={join} className="card p-6">
        <Field label="Join a batch" hint="Ask your instructor for the batch code.">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input className="input" placeholder="Batch code" required value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn-primary shrink-0">Join batch</button>
          </div>
        </Field>
      </form>

      <div className="mt-6">
        {items === null ? <Spinner /> : items.length === 0 ? (
          <EmptyState title="You're not in a batch yet" body="Enter a batch code above to join one." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((b) => (
              <div className="card p-5" key={b.id}>
                <div className="font-bold text-ink">{b.name}</div>
                <div className="mt-0.5 text-sm font-semibold text-accent-700">{b.code}</div>
                <p className="mt-2 text-sm text-slate-500">{b.description || "No description"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
