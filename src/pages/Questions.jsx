import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, patch, post } from "../api";
import { useBase } from "../roles";
import { Badge, EmptyState, ErrorBox, Field, Icon, Modal, Notice, PageHeader, Spinner, StatusBadge, label, useToast } from "../components/ui";

const emptyFilters = { topic: "", difficulty: "", question_type: "", status: "" };

/* ---------- Question bank ---------- */
export function QuestionBank() {
  const base = useBase();
  const notify = useToast();
  const [items, setItems] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  async function load(f = filters) {
    try {
      const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
      setItems(await get(`/api/questions${p.toString() ? `?${p}` : ""}`));
    } catch (e) {
      setError(e.message);
      setItems((cur) => cur || []);
    }
  }
  useEffect(() => { load(); }, []);

  async function act(path, body, done) {
    try {
      setError("");
      await post(path, body);
      notify(done);
      load();
    } catch (e) { setError(e.message); }
  }

  function clear() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  function reject(e) {
    e.preventDefault();
    const r = reason;
    const id = rejecting.id;
    setRejecting(null);
    setReason("");
    if (r) act(`/api/questions/${id}/reject`, { reason: r }, "Question rejected");
  }

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const list = items || [];
  const filtered = Object.values(filters).some(Boolean);

  return (
    <div>
      <PageHeader
        title="Question bank"
        subtitle="Reusable questions. Only approved questions can be added to an exam."
        actions={<>
          <Link className="btn-secondary" to={`${base}/questions/import`}><Icon name="upload" className="h-4 w-4" /> Import</Link>
          <Link className="btn-primary" to={`${base}/questions/new`}><Icon name="plus" className="h-4 w-4" /> New question</Link>
        </>}
      />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <form className="card mb-5 p-4" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="input" placeholder="Topic" aria-label="Topic" value={filters.topic} onChange={set("topic")} />
          <select className="input" aria-label="Difficulty" value={filters.difficulty} onChange={set("difficulty")}>
            <option value="">Any difficulty</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
          </select>
          <select className="input" aria-label="Type" value={filters.question_type} onChange={set("question_type")}>
            <option value="">Any type</option><option value="MCQ">MCQ</option><option value="MULTIPLE_SELECT">Multiple select</option><option value="TRUE_FALSE">True / false</option><option value="SHORT_ANSWER">Short answer</option>
          </select>
          <select className="input" aria-label="Status" value={filters.status} onChange={set("status")}>
            <option value="">Any status</option><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn-secondary btn-sm">Apply filters</button>
          {filtered && <button type="button" className="btn-sm rounded-lg px-3 text-[13px] font-semibold text-slate-500 hover:text-ink" onClick={clear}>Clear</button>}
        </div>
      </form>

      {items === null ? <Spinner /> : list.length === 0 ? (
        <EmptyState
          title={filtered ? "No questions match" : "No questions yet"}
          body={filtered ? "Try changing or clearing the filters." : "Create a question or import several at once."}
          action={!filtered && <Link className="btn-primary" to={`${base}/questions/new`}>New question</Link>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((q) => (
            <div className="card p-5" key={q.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 max-w-3xl flex-1">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={q.status} />
                    <Badge>{label(q.question_type)}</Badge>
                    <Badge>{label(q.difficulty)}</Badge>
                  </div>
                  <h2 className="mt-3 font-medium leading-6 text-ink">{q.question_text}</h2>
                  <p className="mt-1 text-xs text-slate-500">{q.topic} · {q.marks} marks · −{q.negative_marks} negative</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary btn-sm" to={`${base}/questions/${q.id}`}>Open</Link>
                  {q.status === "DRAFT" && <button className="btn-primary btn-sm" onClick={() => act(`/api/questions/${q.id}/approve`, undefined, "Question approved")}>Approve</button>}
                  {q.status === "DRAFT" && <button className="btn-danger-quiet btn-sm" onClick={() => setRejecting(q)}>Reject</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!rejecting}
        title="Reject this question"
        onClose={() => { setRejecting(null); setReason(""); }}
        footer={<><button type="button" className="btn-secondary" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</button><button form="reject-form" className="btn-danger">Reject question</button></>}
      >
        <form id="reject-form" onSubmit={reject}>
          <Field label="Reason" hint="The reason is saved in the question's review history.">
            <textarea className="input min-h-24" required autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

/* ---------- Create / edit question ---------- */
const blankOptions = () => [
  { option_text: "", is_correct: true, option_order: 1 },
  { option_text: "", is_correct: false, option_order: 2 },
];

export function QuestionEditor() {
  const { questionId } = useParams();
  const editing = Boolean(questionId);
  const base = useBase();
  const navg = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState({ question_text: "", question_type: "MCQ", topic: "", difficulty: "MEDIUM", explanation: "", marks: 1, negative_marks: 0, options: blankOptions() });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (questionId) {
      get(`/api/questions/${questionId}`)
        .then((q) => setForm({ question_text: q.question_text, question_type: q.question_type, topic: q.topic, difficulty: q.difficulty, explanation: q.explanation || "", marks: q.marks, negative_marks: q.negative_marks, options: q.options }))
        .catch((e) => setError(e.message));
    }
  }, [questionId]);

  function setType(t) {
    let options = form.options;
    if (t === "SHORT_ANSWER") options = [];
    else if (t === "TRUE_FALSE") options = [{ option_text: "True", is_correct: true, option_order: 1 }, { option_text: "False", is_correct: false, option_order: 2 }];
    else if (!options.length) options = blankOptions();
    setForm({ ...form, question_type: t, options });
  }
  function updateOpt(i, k, v) {
    setForm({ ...form, options: form.options.map((o, idx) => (idx === i ? { ...o, [k]: v } : o)) });
  }
  function markCorrect(i) {
    const multi = form.question_type === "MULTIPLE_SELECT";
    setForm({ ...form, options: form.options.map((x, idx) => ({ ...x, is_correct: multi ? (idx === i ? !x.is_correct : x.is_correct) : idx === i })) });
  }
  function removeOpt(i) {
    setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        marks: Number(form.marks),
        negative_marks: Number(form.negative_marks),
        options: form.question_type === "SHORT_ANSWER" ? [] : form.options.map((o, i) => ({ ...o, option_order: i + 1, is_correct: Boolean(o.is_correct) })),
      };
      const q = editing ? await patch(`/api/questions/${questionId}`, body) : await post("/api/questions", body);
      notify("Question saved");
      navg(`${base}/questions/${q.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const multi = form.question_type === "MULTIPLE_SELECT";
  const fixed = form.question_type === "TRUE_FALSE";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader title={editing ? "Edit question" : "Create question"} back={{ to: `${base}/questions`, label: "Question bank" }} />
      <form className="max-w-3xl space-y-5" onSubmit={submit}>
        {error && <ErrorBox>{error}</ErrorBox>}

        <section className="card p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Type">
              <select className="input" value={form.question_type} onChange={(e) => setType(e.target.value)}>
                <option value="MCQ">MCQ</option><option value="MULTIPLE_SELECT">MULTIPLE_SELECT</option><option value="TRUE_FALSE">TRUE_FALSE</option><option value="SHORT_ANSWER">SHORT_ANSWER</option>
              </select>
            </Field>
            <Field label="Topic"><input className="input" required value={form.topic} onChange={set("topic")} /></Field>
            <Field label="Difficulty">
              <select className="input" value={form.difficulty} onChange={set("difficulty")}>
                <option value="EASY">EASY</option><option value="MEDIUM">MEDIUM</option><option value="HARD">HARD</option>
              </select>
            </Field>
          </div>
          <div className="mt-5"><Field label="Question"><textarea className="input min-h-32" required value={form.question_text} onChange={set("question_text")} /></Field></div>
          <div className="mt-5 grid max-w-xs grid-cols-2 gap-4">
            <Field label="Marks"><input className="input" type="number" min="1" value={form.marks} onChange={set("marks")} /></Field>
            <Field label="Negative marks"><input className="input" type="number" min="0" value={form.negative_marks} onChange={set("negative_marks")} /></Field>
          </div>
        </section>

        {form.question_type !== "SHORT_ANSWER" && (
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Answer options</h2>
                <p className="mt-0.5 text-sm text-slate-500">{multi ? "Tick every correct option." : "Select the one correct option."}</p>
              </div>
              {!fixed && (
                <button type="button" className="btn-secondary btn-sm" onClick={() => setForm({ ...form, options: [...form.options, { option_text: "", is_correct: false, option_order: form.options.length + 1 }] })}>
                  <Icon name="plus" className="h-4 w-4" /> Add option
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {form.options.map((o, i) => (
                <div className={`flex items-center gap-3 rounded-lg border p-2.5 ${o.is_correct ? "border-emerald-300 bg-emerald-50/60" : "border-line"}`} key={i}>
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name="correct"
                    className="h-4 w-4 shrink-0"
                    aria-label={`Option ${i + 1} is correct`}
                    checked={Boolean(o.is_correct)}
                    onChange={() => markCorrect(i)}
                  />
                  <input className="input" value={o.option_text} onChange={(e) => updateOpt(i, "option_text", e.target.value)} placeholder={`Option ${i + 1}`} readOnly={fixed} />
                  {!fixed && form.options.length > 2 && (
                    <button type="button" className="btn-icon shrink-0" onClick={() => removeOpt(i)} aria-label={`Remove option ${i + 1}`}><Icon name="x" className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="card p-6">
          <Field label="Explanation (optional)" hint="Shown to reviewers alongside the question."><textarea className="input min-h-24" value={form.explanation || ""} onChange={set("explanation")} /></Field>
        </section>

        <div className="flex gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save question"}</button>
          <Link className="btn-secondary" to={`${base}/questions`}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}

/* ---------- Import ---------- */
export function QuestionImport({
  examId = null,
  embedded = false,
  onClose = null,
  onDone = null,
}) {
  const base = useBase();
  const notify = useToast();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState(false);

  const sample = `1. What is Python?

A. Programming Language
B. Database
C. Operating System
D. Compiler

Answer: A
Topic: Programming
Difficulty: EASY
Marks: 2
Negative Marks: 0`;

  async function previewImport() {
    if (!text.trim()) return;

    setBusy(true);
    setError("");
    setImported(false);

    try {
      setPreview(
        await post(
          examId
            ? `/api/exams/${examId}/questions/import/preview`
            : "/api/questions/import/preview",
          { text }
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function importQuestions() {
    if (!text.trim() || !preview) return;

    setBusy(true);
    setError("");

    try {
      const result = await post(
        examId
          ? `/api/exams/${examId}/questions/import`
          : "/api/questions/import",
        { text }
      );

      setPreview(null);
      setText("");
      setImported(true);

      if (examId) {
        notify(
          `${result.total_questions} question${result.total_questions === 1 ? "" : "s"} added to this exam`
        );
        onDone?.(result);
      } else {
        notify("Questions imported");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <div className={embedded ? "space-y-5" : ""}>
      {error && <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>}

      {imported && !examId && (
        <div className="mb-4">
          <Notice tone="green">
            Questions imported. They are now in the question bank and waiting for review.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Use this format</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Follow this structure for every question. You can paste multiple numbered questions in the same format.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary btn-sm shrink-0"
                onClick={() => navigator.clipboard?.writeText(sample)}
              >
                Copy sample
              </button>
            </div>

            <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-[11px] leading-5 text-slate-700">
              {sample}
            </pre>
          </div>

          <Field label="Import text">
            <textarea
              className="input min-h-[340px] font-mono text-xs"
              placeholder="Paste your questions here using the sample structure above."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
                setImported(false);
              }}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={!text.trim() || busy}
              onClick={previewImport}
            >
              {busy ? "Processing…" : "Preview"}
            </button>

            <button
              type="button"
              className="btn-primary"
              disabled={!text.trim() || busy || !preview}
              onClick={importQuestions}
            >
              {busy
                ? "Importing…"
                : examId
                  ? "Import into this exam"
                  : "Import"}
            </button>

            {embedded && onClose && (
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold text-ink">Preview</h2>

          {preview ? (
            <div className="mt-4 space-y-3">
              <div className="text-sm font-medium text-slate-600">
                {preview.total_questions}{" "}
                {preview.total_questions === 1 ? "question" : "questions"} found
              </div>

              {preview.questions.map((q, i) => (
                <div key={q.id || i} className="rounded-lg bg-slate-50 p-4">
                  <div className="text-sm font-medium leading-5 text-ink">
                    {i + 1}. {q.question_text}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {q.topic} · {label(q.difficulty)} · {q.marks} marks · {q.negative_marks} negative
                  </div>

                  {q.options?.length > 0 && (
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      {q.options.map((option) => (
                        <div key={option.option_order}>
                          {String.fromCharCode(64 + option.option_order)}. {option.option_text}
                          {q.correct_answers?.includes(option.option_order) && (
                            <span className="ml-2 font-semibold text-emerald-600">Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Select Preview to check the parsed questions here before importing.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div>
      <PageHeader
        title="Import questions"
        subtitle="Preview what the importer reads before adding anything to the bank."
        back={{ to: `${base}/questions`, label: "Question bank" }}
      />
      {content}
    </div>
  );
}
