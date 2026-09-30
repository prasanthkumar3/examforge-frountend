import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon, Logo, initials } from "./ui";
import { roleHome } from "../roles";

/* ---------- Staff (admin + examiner) ----------
   Each staff role gets its own workspace: its own navigation, accent colour
   and sidebar style, so the two never look like the same screen. */
const staffNav = {
  ADMIN: [
    { label: "Overview", to: "/admin", icon: "grid", end: true },
    { label: "Exams", to: "/admin/exams", icon: "file" },
    { label: "Question bank", to: "/admin/questions", icon: "bank" },
    { label: "Batches", to: "/admin/batches", icon: "users" },
  ],
  EXAMINER: [
    { label: "Overview", to: "/examiner", icon: "grid", end: true },
    { label: "Exams", to: "/examiner/exams", icon: "file" },
    { label: "Question bank", to: "/examiner/questions", icon: "bank" },
  ],
};

const staffTheme = {
  ADMIN: {
    title: "Admin console",
    side: "bg-slate-900 border-slate-800",
    brand: "dark",
    link: "text-slate-300 hover:bg-white/10 hover:text-white",
    active: "bg-white/10 text-white",
    sub: "text-slate-400",
    name: "text-white",
    divider: "border-white/10",
    signout: "text-slate-300 hover:bg-white/10 hover:text-white",
  },
  EXAMINER: {
    title: "Examiner workspace",
    side: "bg-white border-line",
    brand: "light",
    link: "text-slate-600 hover:bg-slate-100 hover:text-ink",
    active: "bg-accent-50 text-accent-700",
    sub: "text-slate-500",
    name: "text-ink",
    divider: "border-line",
    signout: "text-slate-600 hover:bg-slate-100 hover:text-ink",
  },
};

export function StaffLayout({ user, onLogout }) {
  const role = user.role;
  const theme = staffTheme[role];
  const items = staffNav[role];
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className={`flex h-full flex-col border-r ${theme.side}`}>
      <div className="px-5 pb-4 pt-5">
        <Logo tone={theme.brand} to={roleHome(role)} />
        <div className={`mt-3 text-xs font-semibold ${theme.sub}`}>{theme.title}</div>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? theme.active : theme.link}`
            }
          >
            <Icon name={it.icon} /> {it.label}
          </NavLink>
        ))}
      </nav>
      <div className={`border-t p-4 ${theme.divider}`}>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-600 text-xs font-bold text-white">{initials(user.full_name)}</span>
          <div className="min-w-0">
            <div className={`truncate text-sm font-semibold ${theme.name}`}>{user.full_name}</div>
            <div className={`truncate text-xs ${theme.sub}`}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} className={`mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${theme.signout}`}>
          <Icon name="logout" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div data-role={role} className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Logo to={roleHome(role)} />
        <button className="btn-icon" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-10 lg:py-10"><Outlet /></div>
      </main>
    </div>
  );
}

/* ---------- Student ----------
   Students get a light top-navigation layout: no sidebar, no management tools. */
const studentNav = [
  { label: "Dashboard", to: "/student", end: true },
  { label: "My attempts", to: "/student/attempts" },
  { label: "My batches", to: "/student/batches" },
];

export function StudentLayout({ user, onLogout }) {
  return (
    <div data-role="STUDENT" className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo to="/student" />
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
              {studentNav.map((it) => <StudentLink key={it.to} {...it} />)}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-700 md:block">{user.full_name}</span>
            <button className="btn-secondary btn-sm" onClick={onLogout}><Icon name="logout" className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 sm:hidden" aria-label="Main">
          {studentNav.map((it) => <StudentLink key={it.to} {...it} />)}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-10"><Outlet /></main>
    </div>
  );
}

function StudentLink({ label, to, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-accent-50 text-accent-700" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`
      }
    >
      {label}
    </NavLink>
  );
}
