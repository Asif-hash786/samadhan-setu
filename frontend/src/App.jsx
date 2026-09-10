import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CitizenDashboard from "./pages/CitizenDashboard";
import ReportChallenge from "./pages/ReportChallenge";
import ExploreChallenges from "./pages/ExploreChallenges";
import MyReports from "./pages/MyReports";
import ImpactDashboard from "./pages/ImpactDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UniversityMatching from "./pages/UniversityMatching";
import UniversityDashboard from "./pages/UniversityDashboard";
import ActiveProjects from "./pages/ActiveProjects";
import AdminChallenges from "./pages/AdminChallenges";
import ProjectTeams from "./pages/ProjectTeams";
import UniversityProfile from "./pages/UniversityProfile";
import UniversityRegister from "./pages/UniversityRegister";
import UniversityApplications from "./pages/UniversityApplications";
import { useSelector } from "react-redux";
function HomeRoute() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === "UNIVERSITY") {
    return <Navigate to="/university/dashboard" replace />;
  }

  return <Home />;
}
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/university/register"
        element={<UniversityRegister />}
      />

      {/* Any visitor can explore verified challenges */}
      <Route
        path="/citizen/explore"
        element={<ExploreChallenges />}
      />

      <Route
        path="/citizen/impact"
        element={<ImpactDashboard />}
      />

      {/* Citizen-only routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["CITIZEN"]} />
        }
      >
        <Route
          path="/citizen/dashboard"
          element={<CitizenDashboard />}
        />

        <Route
          path="/citizen/report"
          element={<ReportChallenge />}
        />

        <Route
          path="/citizen/reports"
          element={<MyReports />}
        />
      </Route>

      {/* Admin-only routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]} />
        }
      >
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/matching"
          element={<UniversityMatching />}
        />
        <Route
          path="/admin/challenges"
          element={<AdminChallenges />}
        />
        <Route
          path="/admin/impact"
          element={<ImpactDashboard />}
        />
        <Route
          path="/admin/university-applications"
          element={<UniversityApplications />}
        />

      </Route>

      {/* University-only routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["UNIVERSITY"]} />
        }
      >
        <Route
          path="/university/dashboard"
          element={<UniversityDashboard />}
        />

        <Route
          path="/university/projects"
          element={<ActiveProjects />}
        />
        <Route
          path="/university/impact"
          element={<ImpactDashboard />}
        />
        <Route
          path="/university/teams"
          element={<ProjectTeams />}
        />
        <Route
          path="/university/profile"
          element={<UniversityProfile />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;