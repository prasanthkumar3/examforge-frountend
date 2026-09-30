import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { getMe, hasToken, logout } from "./auth";
import { roleHome } from "./roles";
import { FullScreenMessage, ToastProvider } from "./components/ui";
import { StaffLayout, StudentLayout } from "./components/layouts";
import { Home, Login, Register, RoomAttempt } from "./pages/Public";
import { CandidateExam, ResultPage } from "./pages/Candidate";
import { MyAttempts, StudentBatches, StudentDashboard } from "./pages/Student";
import { ExamEditor, ExamList, ExamQuestions, ExamResults, StaffDashboard } from "./pages/Exams";
import { QuestionBank, QuestionEditor, QuestionImport } from "./pages/Questions";
import { Batches } from "./pages/Batches";

function Protected({ user, roles }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasToken());

  useEffect(() => {
    if (!hasToken()) return;
    getMe().then(setUser).catch(() => logout()).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullScreenMessage loading text="Loading ExamForge…" />;

  const signIn = (u) => setUser(u);
  const signOut = () => { logout(); setUser(null); };

  return (
    <Routes>
      <Route path="/" element={<Home user={user} />} />
      <Route path="/login" element={user ? <Navigate to={roleHome(user.role)} replace /> : <Login onLogin={signIn} />} />
      <Route path="/register" element={user ? <Navigate to={roleHome(user.role)} replace /> : <Register />} />
      <Route path="/attempt" element={<RoomAttempt />} />
      <Route path="/attempt/:attemptId" element={<CandidateExam />} />

      {/* Admin workspace */}
      <Route element={<Protected user={user} roles={["ADMIN"]} />}>
        <Route path="/admin" element={<StaffLayout user={user} onLogout={signOut} />}>
          <Route index element={<StaffDashboard role="ADMIN" user={user} />} />
          <Route path="exams" element={<ExamList />} />
          <Route path="exams/new" element={<ExamEditor />} />
          <Route path="exams/:examId" element={<ExamEditor />} />
          <Route path="exams/:examId/questions" element={<ExamQuestions />} />
          <Route path="exams/:examId/results" element={<ExamResults />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="questions/new" element={<QuestionEditor />} />
          <Route path="questions/import" element={<QuestionImport />} />
          <Route path="questions/:questionId" element={<QuestionEditor />} />
          <Route path="batches" element={<Batches />} />
        </Route>
      </Route>

      {/* Examiner workspace */}
      <Route element={<Protected user={user} roles={["EXAMINER"]} />}>
        <Route path="/examiner" element={<StaffLayout user={user} onLogout={signOut} />}>
          <Route index element={<StaffDashboard role="EXAMINER" user={user} />} />
          <Route path="exams" element={<ExamList />} />
          <Route path="exams/new" element={<ExamEditor />} />
          <Route path="exams/:examId" element={<ExamEditor />} />
          <Route path="exams/:examId/questions" element={<ExamQuestions />} />
          <Route path="exams/:examId/results" element={<ExamResults />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="questions/new" element={<QuestionEditor />} />
          <Route path="questions/import" element={<QuestionImport />} />
          <Route path="questions/:questionId" element={<QuestionEditor />} />
        </Route>
      </Route>

      {/* Student workspace */}
      <Route element={<Protected user={user} roles={["STUDENT"]} />}>
        <Route path="/student" element={<StudentLayout user={user} onLogout={signOut} />}>
          <Route index element={<StudentDashboard user={user} />} />
          <Route path="attempts" element={<MyAttempts />} />
          <Route path="batches" element={<StudentBatches />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// The result screen sits outside the authenticated layouts because room-code
// candidates can finish a common exam without a student login.
export default function Root() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/attempt/:attemptId/result" element={<ResultPage />} />
          <Route path="*" element={<App />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
