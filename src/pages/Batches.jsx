import { useEffect, useState } from "react";
import { del, get, post } from "../api";
import { ConfirmDialog, EmptyState, ErrorBox, Field, PageHeader, Spinner, useToast } from "../components/ui";

/* ---------- Batches (admin) ---------- */
export function Batches() {
  const notify = useToast();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [members, setMembers] = useState(null);
  const [selectedBatchCode, setSelectedBatchCode] = useState("");
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try { setItems(await get("/api/batches")); } catch (e) { setError(e.message); setItems([]); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try {
      setError("");
      await post("/api/batches", form);
      setForm({ name: "", code: "", description: "" });
      notify("Batch created");
      load();
    } catch (err) { setError(err.message); }
  }

  async function show(code) {
    try {
      setError("");
      setSelectedBatchCode(code);
      setMembers(await get(`/api/batches/${encodeURIComponent(code)}/members`));
    } catch (err) { setError(err.message); }
  }

  async function remove() {
    try {
      await del(`/api/batches/${encodeURIComponent(selectedBatchCode)}/members/${removing}`);
      setRemoving(null);
      notify("Member removed");
      show(selectedBatchCode);
    } catch (err) { setError(err.message); setRemoving(null); }
  }

  const list = items || [];

  return (
    <div>
      <PageHeader title="Batches" subtitle="Groups of students. Batch exams use membership to decide who can take them." />
      {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {items === null ? <Spinner /> : list.length === 0 ? (
            <EmptyState title="No batches yet" body="Create a batch, then share its code with students so they can join." />
          ) : (
            <div className="space-y-3">
              {list.map((b) => (
                <div className={`card flex items-center justify-between gap-4 p-5 ${selectedBatchCode === b.code && members ? "border-accent-500 ring-1 ring-accent-500" : ""}`} key={b.id}>
                  <div className="min-w-0">
                    <div className="font-bold text-ink">{b.name}</div>
                    <div className="mt-0.5 text-sm font-semibold text-accent-700">{b.code}</div>
                    {b.description && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{b.description}</p>}
                  </div>
                  <button className="btn-secondary btn-sm shrink-0" onClick={() => show(b.code)}>View members</button>
                </div>
              ))}
            </div>
          )}

          {members && (
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">Members of {selectedBatchCode}</h2>
                <button className="btn-secondary btn-sm" onClick={() => setMembers(null)}>Close</button>
              </div>
              <div className="mt-4 space-y-2">
                {members.length === 0 && <p className="text-sm text-slate-500">No students have joined this batch yet.</p>}
                {members.map((m) => (
  <div
    key={m.id}
    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
  >
    <div>
      <div className="font-semibold text-ink">
        {m.full_name || "Unknown student"}
      </div>

      <div className="mt-0.5 text-xs font-medium text-slate-500">
        Student ID: {m.student_code || "Not available"}
      </div>
    </div>

    <button
      className="font-semibold text-red-600 hover:underline"
      onClick={() => setRemoving(m.student_id)}
    >
      Remove
    </button>
  </div>
))}
              </div>
            </section>
          )}
        </div>

        <form className="card h-fit p-5 lg:sticky lg:top-6" onSubmit={create}>
          <h2 className="text-base font-bold text-ink">Create a batch</h2>
          <div className="mt-4 space-y-4">
            <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Code" hint="Students enter this code to join."><input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label="Description (optional)"><textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <button className="btn-primary w-full">Create batch</button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!removing}
        title="Remove this student?"
        body={`Student ${removing} will be removed from ${selectedBatchCode} and lose access to its batch exams.`}
        confirmLabel="Remove student"
        danger
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
