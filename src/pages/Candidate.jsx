import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, post, put } from "../api";
import { ConfirmDialog, ErrorBox, FullScreenMessage, Icon, Logo } from "../components/ui";

const qid = (q) => q.id ?? q.question_id;
function toggle(arr, id) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

/* ---------- Exam-taking screen ----------
   Deliberately separate from the dashboards: no navigation, just the exam. */
export function CandidateExam() {
  const { attemptId } = useParams();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navg = useNavigate();

  async function load() {
    try {
      const data = await get(`/student-exams/${attemptId}/questions`);
      setExam(data);
      const saved = await get(`/exam-attempts/${attemptId}/answers`);
      const mapped = {};
      saved.forEach((a) => (mapped[a.question_id] = a.selected_option_ids));
      setAnswers(mapped);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { load(); }, [attemptId]);

  useEffect(() => {
    if (!exam) return;
    const id = setInterval(() => setExam((e) => (e ? { ...e, remaining_seconds: Math.max(0, e.remaining_seconds - 1) } : e)), 1000);
    return () => clearInterval(id);
  }, [!!exam]);

  useEffect(() => {
    if (exam?.remaining_seconds === 0) submitExam(true);
  }, [exam?.remaining_seconds]);

  async function choose(q, ids) {
    setAnswers((a) => ({ ...a, [qid(q)]: ids }));
    setSaving(true);
    try {
      await put(`/exam-attempts/${attemptId}/answers/${qid(q)}`, { selected_option_ids: ids });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitExam(auto = false) {
    setSubmitting(true);
    try {
      const result = await post(`/exam-attempts/${attemptId}/submit`);
      sessionStorage.setItem(`examforge_result_${attemptId}`, JSON.stringify(result));
      navg(`/attempt/${attemptId}/result`);
    } catch (e) {
      setConfirming(false);
      if (!auto) setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (busy) return <FullScreenMessage loading text="Loading exam…" />;
  if (error && !exam) return <FullScreenMessage text={error} />;
  if (!exam) return null;
  if (!exam.questions?.length) return <FullScreenMessage text="This exam has no questions." />;

  const q = exam.questions[current];
  const total = exam.questions.length;
  const answered = exam.questions.filter((x) => answers[qid(x)]?.length).length;
  const unanswered = total - answered;
  const secs = exam.remaining_seconds;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const timerTone = secs < 60 ? "bg-red-50 text-red-600" : secs < 300 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700";
  const multi = q.question_type === "MULTIPLE_SELECT";
  const selected = answers[qid(q)] || [];

  return (
    <div data-role="STUDENT" className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-600 text-sm font-extrabold text-white sm:grid">E</span>
            <div className="min-w-0">
              <div className="truncate font-bold text-ink">{exam.title}</div>
              <div className="text-xs text-slate-500">Question {current + 1} of {total} · {answered} answered</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`rounded-lg px-3 py-2 text-sm font-bold tabular-nums ${timerTone}`} role="timer" aria-label="Time remaining">{mm}:{ss}</div>
            <button className="btn-secondary btn-sm" onClick={() => setConfirming(true)}>Submit</button>
          </div>
        </div>
        <div className="h-1 bg-slate-100"><div className="h-full bg-accent-600 transition-all" style={{ width: `${(answered / total) * 100}%` }} /></div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_260px]">
        <section className="card p-6 sm:p-8">
          {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Question {q.question_order ?? current + 1}</span>
            <span>{q.marks} {q.marks === 1 ? "mark" : "marks"}{q.negative_marks ? ` · −${q.negative_marks} if wrong` : ""}</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold leading-8 text-ink">{q.question_text}</h1>
          {multi && <p className="mt-2 text-sm text-slate-500">Select all that apply.</p>}

          <div className="mt-6 space-y-3" role={multi ? "group" : "radiogroup"}>
            {q.options.map((o, idx) => {
              const on = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => choose(q, multi ? toggle(selected, o.id) : [o.id])}
                  role={multi ? "checkbox" : "radio"}
                  aria-checked={on}
                  className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${on ? "border-accent-600 bg-accent-50" : "border-line bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-xs font-bold ${multi ? "rounded-md" : "rounded-full"} ${on ? "bg-accent-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {String.fromCharCode(65 + ((o.option_order ?? idx + 1) - 1))}
                  </span>
                  <span className="leading-6">{o.option_text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              <Icon name="arrowLeft" className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs text-slate-400" aria-live="polite">{saving ? "Saving…" : "Saved automatically"}</span>
            {current < total - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent(current + 1)}>Next <Icon name="arrowRight" className="h-4 w-4" /></button>
            ) : (
              <button className="btn-primary" onClick={() => setConfirming(true)}>Submit exam</button>
            )}
          </div>
        </section>

        <aside className="card h-fit p-5">
          <h2 className="text-sm font-bold text-ink">Questions</h2>
          <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-5">
            {exam.questions.map((x, i) => {
              const done = answers[qid(x)]?.length;
              return (
                <button
                  key={qid(x)}
                  onClick={() => setCurrent(i)}
                  aria-label={`Question ${i + 1}${done ? ", answered" : ""}`}
                  aria-current={i === current}
                  className={`h-9 rounded-lg text-xs font-bold transition-colors ${i === current ? "bg-accent-600 text-white" : done ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-accent-600" /> Current</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-200" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-200" /> Not answered</div>
          </div>
        </aside>
      </main>

      <ConfirmDialog
        open={confirming}
        title="Submit your exam?"
        body={unanswered > 0
          ? `You have answered ${answered} of ${total} questions. ${unanswered} ${unanswered === 1 ? "question is" : "questions are"} still blank. Once you submit you can't change your answers.`
          : `You have answered all ${total} questions. Once you submit you can't change your answers.`}
        confirmLabel="Submit exam"
        busy={submitting}
        onConfirm={() => submitExam(false)}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}


export function ResultPage() {
  const { attemptId } = useParams();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    get(`/exam-attempts/${attemptId}/result`)
      .then(setR)
      .catch((e) => setError(e.message));
  }, [attemptId]);

  if (error) return <FullScreenMessage text={error} />;
  if (!r) return <FullScreenMessage loading text="Loading result…" />;

  const items = [
    ["Questions", r.total_questions ?? "—"],
    ["Answered", r.answered_questions ?? "—"],
  ];

  const questions = r.questions ?? [];

  return (
    <div
      data-role="STUDENT"
      className="min-h-screen bg-canvas px-4 py-10"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {/* Result summary */}
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="h-6 w-6" />
          </span>

          <h1 className="mt-4 text-xl font-bold text-ink">
            Exam submitted
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Your answers were recorded and scored.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 py-6">
            <div className="text-sm font-medium text-slate-500">
              Your score
            </div>

            <div className="mt-1 text-5xl font-extrabold tracking-tight text-ink">
              {r.score ?? 0}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {items.map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl bg-slate-50 p-4"
              >
                <div className="text-xs font-medium text-slate-500">
                  {k}
                </div>

                <div className="mt-1 text-xl font-bold text-ink">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question review */}
        {questions.length > 0 && (
          <div className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-ink">
                Question Review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review your answers and see the correct responses.
              </p>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => {
                const selectedIds = new Set(
                  (question.selected_option_ids ?? []).map(String)
                );

                const correctIds = new Set(
                  (question.correct_option_ids ?? []).map(String)
                );

                const isCorrect =
                  question.awarded_marks > 0 &&
                  selectedIds.size > 0 &&
                  [...selectedIds].every((id) => correctIds.has(id)) &&
                  selectedIds.size === correctIds.size;

                const isAnswered = selectedIds.size > 0;

                return (
                  <div
                    key={question.question_id}
                    className="card overflow-hidden"
                  >
                    {/* Question header */}
                    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                          {question.question_order ?? index + 1}
                        </span>

                        <span className="text-sm font-semibold text-ink">
                          Question {question.question_order ?? index + 1}
                        </span>
                      </div>

                      {isCorrect ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Correct
                        </span>
                      ) : isAnswered ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Incorrect
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Not answered
                        </span>
                      )}
                    </div>

                    {/* Question body */}
                    <div className="p-5">
                      <div className="text-sm font-semibold leading-6 text-ink">
                        {question.question_text}
                      </div>

                      {/* Options */}
                      <div className="mt-5 space-y-2">
                        {(question.options ?? []).map((option, optionIndex) => {
                          const optionId = String(option.id);
                          const selected = selectedIds.has(optionId);
                          const correct = correctIds.has(optionId);

                          let optionClass =
                            "border-line bg-white";

                          if (correct) {
                            optionClass =
                              "border-emerald-300 bg-emerald-50";
                          } else if (selected) {
                            optionClass =
                              "border-red-300 bg-red-50";
                          }

                          return (
                            <div
                              key={option.id}
                              className={`flex items-start gap-3 rounded-xl border p-4 ${optionClass}`}
                            >
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {String.fromCharCode(
                                  65 + optionIndex
                                )}
                              </span>

                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="text-sm text-ink">
                                  {option.option_text}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selected && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                      Your response
                                    </span>
                                  )}

                                  {correct && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                      Correct answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Marks */}
                      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                        <span className="text-xs font-medium text-slate-500">
                          Marks
                        </span>

                        <span
                          className={`text-sm font-bold ${
                            question.awarded_marks > 0
                              ? "text-emerald-600"
                              : question.awarded_marks < 0
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {question.awarded_marks > 0 ? "+" : ""}
                          {question.awarded_marks ?? 0} /{" "}
                          {question.marks ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No question data */}
        {questions.length === 0 && (
          <div className="card mt-6 p-6 text-center">
            <div className="text-sm font-semibold text-ink">
              Question review unavailable
            </div>

            <p className="mt-1 text-sm text-slate-500">
              The exam result was recorded, but no question details
              were returned.
            </p>
          </div>
        )}

        {/* Done */}
        <Link
          to="/"
          className="btn-primary mt-7 w-full"
        >
          Done
        </Link>
      </div>
    </div>
  );
}
