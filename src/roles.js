import { useLocation } from "react-router-dom";

export function roleHome(role) {
  return role === "ADMIN" ? "/admin" : role === "EXAMINER" ? "/examiner" : "/student";
}

// Staff pages are shared by /admin and /examiner; this returns the current prefix.
export function useBase() {
  const { pathname } = useLocation();
  return pathname.startsWith("/admin") ? "/admin" : "/examiner";
}
