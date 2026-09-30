import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { del, get, patch, post, put } from "../api";
import { useBase } from "../roles";
import { QuestionImport } from "./Questions";
import {
  Badge, ConfirmDialog, EmptyState, ErrorBox, Field, Icon, Modal, Notice, PageHeader, Spinner, Stat, StatusBadge, Tabs, fmtDate, label, useToast,
} from "../components/ui";

/* ---------- Overview (admin + examiner) ---------- */
export function StaffDashboard({ role, user }) {
  const base = useBase();
  const [exams, setExams] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    get("/api/exams").then(setExams).catch((e) => { setError(e.message); setExams([]); });
  }, []);

  const list = exams || [];
  const count = (s) => list.filter((e) => e.status === s).length;
  const firstName = (user.full_name || "").split(" ")[0];
  const subtitle = role === "ADMIN"
    ? "Manage exams, the question bank and student batches."
    : "Build exams, keep your questions organised and review results.";

  const actions = [
    { label: "Create exam", to: `${base}/exams/new`, icon: "plus" },
    { label: "New question", to: `${base}/questions/new`, icon: "edit" },
    { label: "Import questions", to: `${base}/questions/import`, icon: "upload" },
    ...(role === "ADMIN" ? [{ label: "Manage batches", to: `${base}/batches`, icon: "users" }] : []),
  ];

  return (
    <div>
      <PageHeader title={`Welcome back, ${firstName}`} subtitle={subtitle} />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total exams" value={exams === null ? "…" : list.length} />
        <Stat label="Published" value={exams === null ? "…" : count("PUBLISHED")} hint="Open to candidates" />
        <Stat label="Drafts" value={exams === null ? "…" : count("DRAFT")} hint="Still being prepared" />
        <Stat label="Closed" value={exams === null ? "…" : count("CLOSED")} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Recent exams</h2>
            {list.length > 0 && <Link to={`${base}/exams`} className="text-sm font-semibold text-accent-700 hover:underline">View all</Link>}
          </div>
          {exams === null ? <Spinner /> : list.length === 0 ? (
            <EmptyState
              title="No exams yet"
              body="Create your first exam, then add approved questions and publish it."
              action={<Link to={`${base}/exams/new`} className="btn-primary"><Icon name="plus" className="h-4 w-4" /> Create exam</Link>}
            />
          ) : (
            <div className="card divide-y divide-line">
              {list.slice(0, 6).map((e) => (
                <Link key={e.id} to={`${base}/exams/${e.id}`} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{e.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{label(e.exam_type)} · {e.duration_minutes} min</div>
                  </div>
                  <StatusBadge value={e.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Quick actions</h2>
          <div className="card divide-y divide-line">
            {actions.map((a) => (
              <Link key={a.to} to={a.to} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-50 text-accent-700"><Icon name={a.icon} /></span>
                {a.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Exam list ---------- */
const lifecycle = {
  publish: {
    title: "Publish this exam?",
    body: "Candidates will be able to start it. Its questions can't be changed while it is published.",
    confirm: "Publish",
    done: "Exam published",
  },
  close: {
    title: "Close this exam?",
    body: "Candidates will no longer be able to start new attempts. You can reopen it later as a draft.",
    confirm: "Close exam",
    done: "Exam closed",
  },
  reopen: {
    title: "Reopen this exam?",
    body: "It goes back to draft so you can edit it. Publish it again when you're ready.",
    confirm: "Reopen",
    done: "Exam reopened as draft",
  },
};

export function ExamList() {
  const base = useBase();
  const notify = useToast();
  const [exams, setExams] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setExams(await get("/api/exams")); } catch (e) { setError(e.message); setExams([]); }
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setBusy(true);
    try {
      await post(`/api/exams/${pending.exam.id}/${pending.kind}`);
      notify(lifecycle[pending.kind].done);
      setPending(null);
      load();
    } catch (e) {
      setError(e.message);
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); notify("Room code copied"); } catch { notify("Couldn't copy", "error"); }
  }

  const list = exams || [];
  const shown = list.filter((e) => (tab === "ALL" || e.status === tab) && e.title.toLowerCase().includes(q.toLowerCase()));
  const count = (s) => list.filter((e) => e.status === s).length;

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Create, publish and close exams."
        actions={<Link to={`${base}/exams/new`} className="btn-primary"><Icon name="plus" className="h-4 w-4" /> Create exam</Link>}
      />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "ALL", label: "All", count: list.length },
            { value: "DRAFT", label: "Draft", count: count("DRAFT") },
            { value: "PUBLISHED", label: "Published", count: count("PUBLISHED") },
            { value: "CLOSED", label: "Closed", count: count("CLOSED") },
          ]}
        />
        <div className="relative w-full sm:w-64">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search exams" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search exams" />
        </div>
      </div>

      {exams === null ? <Spinner /> : shown.length === 0 ? (
        <EmptyState
          title={list.length === 0 ? "No exams yet" : "No exams match"}
          body={list.length === 0 ? "Create an exam to get started." : "Try another status or search term."}
          action={list.length === 0 && <Link to={`${base}/exams/new`} className="btn-primary">Create exam</Link>}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((e) => (
            <div className="card p-5" key={e.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-ink">{e.title}</h2>
                    <StatusBadge value={e.status} />
                    <Badge>{label(e.exam_type)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{e.description || "No description"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <span>{e.duration_minutes} min</span>
                    {e.max_attempts !== undefined && <span>{e.max_attempts} {e.max_attempts === 1 ? "attempt" : "attempts"} allowed</span>}
                    {e.room_code && (
                      <button onClick={() => copy(e.room_code)} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200" title="Copy room code">
                        Room {e.room_code} <Icon name="copy" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="btn-secondary btn-sm" to={`${base}/exams/${e.id}`}>Edit</Link>
                  <Link className="btn-secondary btn-sm" to={`${base}/exams/${e.id}/questions`}>Questions</Link>
                  <Link className="btn-secondary btn-sm" to={`${base}/exams/${e.id}/results`}>Results</Link>
                  {e.status === "DRAFT" && <button className="btn-primary btn-sm" onClick={() => setPending({ exam: e, kind: "publish" })}>Publish</button>}
                  {e.status === "PUBLISHED" && <button className="btn-danger-quiet btn-sm" onClick={() => setPending({ exam: e, kind: "close" })}>Close</button>}
                  {e.status === "CLOSED" && <button className="btn-secondary btn-sm" onClick={() => setPending({ exam: e, kind: "reopen" })}>Reopen</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title={pending ? lifecycle[pending.kind].title : ""}
        body={pending ? `${pending.exam.title}: ${lifecycle[pending.kind].body}` : ""}
        confirmLabel={pending ? lifecycle[pending.kind].confirm : ""}
        danger={pending?.kind === "close"}
        busy={busy}
        onConfirm={run}
        onClose={() => setPending(null)}
      />
    </div>
  );
}

/* ---------- Create / edit exam ---------- */
function Section({ title, subtitle, children }) {
  return (
    <section className="card p-6">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ExamEditor() {
  const { examId } = useParams();
  const editing = Boolean(examId);
  const base = useBase();
  const navg = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState({ title: "", description: "", instructions: "", exam_type: "COMMON", room_code: "", duration_minutes: 60, start_at: "", end_at: "", max_attempts: 1, batch_codes: [], completion_target: "", auto_close_on_target: false });
  const [batches, setBatches] = useState([]);
  const [batchSearch, setBatchSearch] = useState("");
  const [selectedBatchCodes, setSelectedBatchCodes] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
  async function loadData() {
    try {
      const batchList = await get("/api/batches");
      setBatches(batchList || []);

      if (examId) {
        const examList = await get("/api/exams");

        const e = examList.find((x) => x.id === examId);

        if (!e) {
          throw new Error("Exam not found");
        }

        setForm({
          ...e,
          start_at: e.start_at ? e.start_at.slice(0, 16) : "",
          end_at: e.end_at ? e.end_at.slice(0, 16) : "",
          completion_target: e.completion_target || "",
        });

        if (Array.isArray(e.batch_codes)) {
          setSelectedBatchCodes(e.batch_codes);
        } else {
          setSelectedBatchCodes([]);
        }
      }
    } catch (e) {
      setError(e.message);
    }
  }

  loadData();
}, [examId]);

function body() {
  return {
    title: form.title,
    description: form.description || null,
    instructions: form.instructions || null,
    exam_type: form.exam_type,
    room_code: form.exam_type === "BATCH" ? null : form.room_code || null,
    duration_minutes: Number(form.duration_minutes),
    start_at: form.start_at
      ? new Date(form.start_at).toISOString()
      : null,
    end_at: form.end_at
      ? new Date(form.end_at).toISOString()
      : null,
    max_attempts: Number(form.max_attempts),

    batch_codes:
      form.exam_type === "COMMON"
        ? []
        : selectedBatchCodes,

    completion_target: form.completion_target
      ? Number(form.completion_target)
      : null,

    auto_close_on_target: Boolean(form.auto_close_on_target),
  };
}

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = editing ? await patch(`/api/exams/${examId}`, body()) : await post("/api/exams/", body());
      notify("Exam saved");
      navg(`${base}/exams/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        title={editing ? "Edit exam" : "Create exam"}
        back={{ to: `${base}/exams`, label: "All exams" }}
        actions={editing && <Link to={`${base}/exams/${examId}/questions`} className="btn-secondary btn-sm">Manage questions</Link>}
      />
      <form className="max-w-3xl space-y-5" onSubmit={submit}>
        {error && <ErrorBox>{error}</ErrorBox>}

        <Section title="Basics">
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Title"><input className="input" required value={form.title} onChange={set("title")} /></Field>
              <Field label="Exam type">
                <select className="input" value={form.exam_type} onChange={set("exam_type")}>
                  <option value="COMMON">COMMON</option>
                  <option value="BATCH">BATCH</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </Field>
            </div>
            <Field label="Description"><textarea className="input min-h-24" value={form.description || ""} onChange={set("description")} /></Field>
            <Field label="Instructions for candidates"><textarea className="input min-h-24" value={form.instructions || ""} onChange={set("instructions")} /></Field>
          </div>
        </Section>

        <Section
  title="Access"
  subtitle="Common exams use a room code. Batch exams use selected batches."
>
  <div className="grid gap-5 md:grid-cols-2">

    <Field label="Room code">
      <input
        className="input"
        disabled={form.exam_type === "BATCH"}
        value={form.room_code || ""}
        onChange={set("room_code")}
      />
    </Field>

    <Field
      label="Batches"
      hint="Select one or more batches for this exam."
    >
      <div
        className={`rounded-xl border border-slate-200 bg-white p-3 ${
          form.exam_type === "COMMON"
            ? "pointer-events-none opacity-50"
            : ""
        }`}
      >
        {/* Search */}
        <input
          type="text"
          className="input mb-3"
          placeholder="Search batches..."
          disabled={form.exam_type === "COMMON"}
          value={batchSearch}
          onChange={(e) => setBatchSearch(e.target.value)}
        />

        {/* Select / Clear */}
        {form.exam_type !== "COMMON" && batches.length > 0 && (
          <div className="mb-3 flex items-center justify-between px-1">
            <button
              type="button"
              className="text-xs font-semibold text-accent-700 hover:underline"
              onClick={() => {
                setSelectedBatchCodes(
                  batches.map((batch) => batch.code)
                );
              }}
            >
              Select all
            </button>

            <button
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-red-600 hover:underline"
              onClick={() => setSelectedBatchCodes([])}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Batch list */}
        {batches.length === 0 ? (
          <p className="px-2 py-2 text-sm text-slate-500">
            No batches available.
          </p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {batches
              .filter((batch) => {
                const search = batchSearch.trim().toLowerCase();

                if (!search) return true;

                return (
                  batch.name?.toLowerCase().includes(search) ||
                  batch.code?.toLowerCase().includes(search)
                );
              })
              .map((batch) => {
                const selected = selectedBatchCodes.includes(batch.code);

                return (
                  <label
                    key={batch.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                      selected
                        ? "bg-accent-50 ring-1 ring-accent-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={form.exam_type === "COMMON"}
                      onChange={(e) => {
                        setSelectedBatchCodes((current) =>
                          e.target.checked
                            ? [...current, batch.code]
                            : current.filter(
                                (code) => code !== batch.code
                              )
                        );
                      }}
                      className="h-4 w-4"
                    />

                    <div className="min-w-0">
                      <div className="font-medium text-ink">
                        {batch.name}
                      </div>

                      <div className="text-xs font-semibold text-accent-700">
                        {batch.code}
                      </div>
                    </div>
                  </label>
                );
              })}

            {batches.filter((batch) => {
              const search = batchSearch.trim().toLowerCase();

              if (!search) return true;

              return (
                batch.name?.toLowerCase().includes(search) ||
                batch.code?.toLowerCase().includes(search)
              );
            }).length === 0 && (
              <p className="px-2 py-3 text-sm text-slate-500">
                No matching batches found.
              </p>
            )}
          </div>
        )}

        {/* Selected count */}
        {form.exam_type !== "COMMON" && (
          <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
            {selectedBatchCodes.length}{" "}
            {selectedBatchCodes.length === 1
              ? "batch"
              : "batches"}{" "}
            selected
          </div>
        )}
      </div>
    </Field>

  </div>
</Section>

        <Section title="Timing and limits">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Duration (minutes)"><input className="input" type="number" min="1" value={form.duration_minutes} onChange={set("duration_minutes")} /></Field>
            <Field label="Maximum attempts"><input className="input" type="number" min="1" value={form.max_attempts} onChange={set("max_attempts")} /></Field>
            <Field label="Opens at"><input className="input" type="datetime-local" value={form.start_at || ""} onChange={set("start_at")} /></Field>
            <Field label="Closes at"><input className="input" type="datetime-local" value={form.end_at || ""} onChange={set("end_at")} /></Field>
          </div>
        </Section>

        <Section title="Completion target" subtitle="Optionally close the exam once enough candidates have submitted.">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={form.auto_close_on_target} onChange={(e) => setForm({ ...form, auto_close_on_target: e.target.checked })} />
            Close automatically when the target is reached
          </label>
          {form.auto_close_on_target && (
            <div className="mt-4 max-w-xs">
              <Field label="Submitted attempts needed"><input className="input" type="number" min="1" value={form.completion_target} onChange={set("completion_target")} /></Field>
            </div>
          )}
        </Section>

        <div className="flex gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save exam"}</button>
          <Link className="btn-secondary" to={`${base}/exams`}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}

/* ---------- Exam questions ---------- */
export function ExamQuestions() {
  const { examId } = useParams();
  const base = useBase();
  const notify = useToast();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [bank, setBank] = useState([]);
  const [form, setForm] = useState({ question_id: "", question_order: 1, marks: 1, negative_marks: 0 });
  const [error, setError] = useState("");
  const [scoring, setScoring] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  async function load() {
    try {
      const [examList, q, b] = await Promise.all([
        get("/api/exams"),
        get(`/api/exams/${examId}/questions`),
        get("/api/questions?status=APPROVED"),
      ]);

      const e = examList.find((x) => x.id === examId);
      if (!e) throw new Error("Exam not found");

      setExam(e);
      setQuestions(q.questions || []);
      setBank(b);
      setForm((f) => ({
        ...f,
        question_order: (q.questions || []).length + 1,
      }));
    } catch (err) {
      setError(err.message);
      setQuestions((cur) => cur || []);
    }
  }

  useEffect(() => {
    load();
  }, [examId]);

  async function add(e) {
    e.preventDefault();

    try {
      setError("");

      await post(`/api/exams/${examId}/questions`, {
        ...form,
        question_order: Number(form.question_order),
        marks: Number(form.marks),
        negative_marks: Number(form.negative_marks),
      });

      setForm({ ...form, question_id: "" });
      notify("Question added");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    try {
      await del(`/api/exams/${examId}/questions/${removing.question_id}`);
      setRemoving(null);
      notify("Question removed");
      load();
    } catch (err) {
      setError(err.message);
      setRemoving(null);
    }
  }

  async function saveScore(e) {
    e.preventDefault();

    try {
      await patch(
        `/api/exams/${examId}/questions/${scoring.q.question_id}`,
        {
          marks: Number(scoring.marks),
          negative_marks: Number(scoring.negative),
        }
      );

      setScoring(null);
      notify("Scoring updated");
      load();
    } catch (err) {
      setError(err.message);
      setScoring(null);
    }
  }

  async function move(index, direction) {
    if (!exam || exam.status !== "DRAFT") return;

    const next = index + direction;
    if (next < 0 || next >= questions.length) return;

    const copy = [...questions];
    [copy[index], copy[next]] = [copy[next], copy[index]];

    try {
      await put(`/api/exams/${examId}/questions/reorder`, {
        questions: copy.map((q, i) => ({
          question_id: q.question_id,
          question_order: i + 1,
        })),
      });

      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const draft = exam?.status === "DRAFT";
  const list = questions || [];
  const available = bank.filter(
    (x) => !list.some((q) => q.question_id === x.id)
  );

  return (
    <div>
      <PageHeader
        title={exam?.title || "Exam questions"}
        subtitle={
          exam
            ? `${list.length} ${list.length === 1 ? "question" : "questions"}`
            : undefined
        }
        back={{ to: `${base}/exams`, label: "All exams" }}
        actions={
          exam && (
            <>
              <StatusBadge value={exam.status} />

              {draft && (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => setImportOpen(true)}
                >
                  <Icon name="upload" className="h-4 w-4" />
                  Import questions
                </button>
              )}

              <Link
                className="btn-secondary btn-sm"
                to={`${base}/exams/${examId}/results`}
              >
                <Icon name="chart" className="h-4 w-4" />
                Results
              </Link>
            </>
          )
        }
      />

      {error && (
        <div className="mb-5">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}

      {exam && !draft && (
        <div className="mb-5">
          <Notice>
            This exam is {label(exam.status).toLowerCase()}, so its question
            list is locked. Reopen it from the Exams page to make changes.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {questions === null ? (
            <Spinner />
          ) : list.length === 0 ? (
            <EmptyState
              title="No questions yet"
              body="Import questions directly into this exam or add approved questions from the question bank."
              action={
                draft ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setImportOpen(true)}
                  >
                    <Icon name="upload" className="h-4 w-4" />
                    Import questions
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {list.map((q, i) => (
                <div
                  className="card flex items-start gap-4 p-4"
                  key={q.question_id}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-50 text-sm font-bold text-accent-700">
                    {i+1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium leading-6 text-ink">
                      {q.question_text ||
                        q.question?.question_text ||
                        `Question ${q.question_id}`}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {q.marks} marks · −{q.negative_marks} negative
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        className="btn-icon"
                        disabled={!draft || i === 0}
                        onClick={() => move(i, -1)}
                        aria-label="Move up"
                      >
                        <Icon name="arrowUp" className="h-4 w-4" />
                      </button>

                      <button
                        className="btn-icon"
                        disabled={!draft || i === list.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label="Move down"
                      >
                        <Icon name="arrowDown" className="h-4 w-4" />
                      </button>

                      <button
                        className="btn-secondary btn-sm"
                        onClick={() =>
                          setScoring({
                            q,
                            marks: q.marks,
                            negative: q.negative_marks,
                          })
                        }
                      >
                        Scoring
                      </button>

                      <button
                        className="btn-danger-quiet btn-sm"
                        disabled={!draft}
                        onClick={() => setRemoving(q)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          className="card h-fit p-5 lg:sticky lg:top-6"
          onSubmit={add}
        >
          <h2 className="text-base font-bold text-ink">
            Add from question bank
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Select an already approved reusable question.
          </p>

          <div className="mt-4 space-y-4">
            <Field label="Question">
              <select
                className="input"
                required
                value={form.question_id}
                onChange={(e) =>
                  setForm({ ...form, question_id: e.target.value })
                }
              >
                <option value="">Select a question…</option>

                {available.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.question_text.slice(0, 70)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label="Order">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.question_order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      question_order: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Marks">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.marks}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      marks: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Negative">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.negative_marks}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      negative_marks: e.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <button className="btn-primary w-full">
              Add to exam
            </button>
          </div>
        </form>
      </div>

      <Modal
        open={importOpen}
        title={`Import questions into ${exam?.title || "this exam"}`}
        onClose={() => setImportOpen(false)}
        className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto"
      >
      <QuestionImport
        examId={examId}
        embedded
        onClose={() => setImportOpen(false)}
        onDone={() => {
        setImportOpen(false);
        load();
        }}
      />
      </Modal>

      <Modal
        open={!!scoring}
        title="Edit scoring"
        onClose={() => setScoring(null)}
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setScoring(null)}
            >
              Cancel
            </button>
            <button form="scoring-form" className="btn-primary">
              Save
            </button>
          </>
        }
      >
        {scoring && (
          <form
            id="scoring-form"
            onSubmit={saveScore}
            className="grid grid-cols-2 gap-4"
          >
            <Field label="Marks">
              <input
                className="input"
                type="number"
                min="0"
                required
                value={scoring.marks}
                onChange={(e) =>
                  setScoring({
                    ...scoring,
                    marks: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Negative marks">
              <input
                className="input"
                type="number"
                min="0"
                required
                value={scoring.negative}
                onChange={(e) =>
                  setScoring({
                    ...scoring,
                    negative: e.target.value,
                  })
                }
              />
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removing}
        title="Remove this question?"
        body="It is removed from this exam only. The question stays in the question bank."
        confirmLabel="Remove"
        danger
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

/* ---------- Exam results ---------- */
export function ExamResults() {
  const { examId } = useParams();
  const base = useBase();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    get(`/exam-attempts/exam/${examId}/results`).then(setItems).catch((e) => { setError(e.message); setItems([]); });
  }, [examId]);

  const list = items || [];
  const submitted = list.filter((a) => a.status === "SUBMITTED").length;

  return (
    <div>
      <PageHeader title="Results" subtitle="Every attempt made on this exam." back={{ to: `${base}/exams`, label: "All exams" }} />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <div className="mb-5 grid max-w-md grid-cols-2 gap-4">
        <Stat label="Attempts" value={items === null ? "…" : list.length} />
        <Stat label="Submitted" value={items === null ? "…" : submitted} />
      </div>

      {items === null ? <Spinner /> : list.length === 0 ? (
        <EmptyState title="No attempts yet" body="Attempts appear here as soon as candidates start the exam." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Access</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3 text-right">Score</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-ink">{a.candidate_name || "Student"}</div>
                      <div className="text-xs text-slate-400">{a.candidate_email || "—"}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{label(a.access_method)}</td>
                    <td className="px-5 py-3.5"><StatusBadge value={a.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(a.submitted_at)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-ink">{a.score ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right"><Link className="font-semibold text-accent-700 hover:underline" to={`/attempt/${a.id}/result`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
