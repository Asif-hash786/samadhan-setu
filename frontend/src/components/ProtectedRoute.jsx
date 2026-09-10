import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ allowedRoles }) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto size-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const fallbackRoutes = {
      CITIZEN: "/citizen/dashboard",
      ADMIN: "/admin/dashboard",
      UNIVERSITY: "/university/dashboard",
    };

    return (
      <Navigate
        to={fallbackRoutes[user?.role] || "/"}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;