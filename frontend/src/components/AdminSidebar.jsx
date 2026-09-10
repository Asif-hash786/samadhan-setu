import {
  BarChart3,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Network,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";
import { logout } from "../store/slices/authSlice";

const links = [
  {
    title: "Verification Queue",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Challenges",
    path: "/admin/challenges",
    icon: CheckSquare,
  },
  {
    title: "University Matching",
    path: "/admin/matching",
    icon: Network,
  },
  {
    title: "Impact Dashboard",
    path: "/admin/impact",
    icon: BarChart3,
  },
  {
    title: "University Applications",
    path: "/admin/university-applications",
    icon: CheckSquare,
  },
];

function AdminSidebar({ mobileOpen, closeSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "AD";

  function handleLogout() {
    dispatch(logout());
    closeSidebar?.();
    navigate("/auth", { replace: true });
  }

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#18143e] px-4 py-6 text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <NavLink
          to="/"
          onClick={closeSidebar}
          className="flex items-center gap-3 px-2"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-purple-600 text-xl font-extrabold">
            स
          </div>

          <div>
            <h1 className="text-lg font-bold leading-none">
              Samadhan Setu
            </h1>

            <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-purple-300">
              ADMIN CONSOLE
            </p>
          </div>
        </NavLink>

        <div className="mt-9 rounded-2xl border border-purple-400/20 bg-purple-400/10 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-600 text-sm font-bold">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.name || "Administrator"}
              </p>

              <p className="truncate text-xs text-purple-200">
                {user?.email || "Admin account"}
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.2em] text-purple-300/60">
            ADMINISTRATION
          </p>

          {links.map(({ title, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive
                  ? "bg-purple-600 text-white"
                  : "text-purple-100 hover:bg-white/10"
                }`
              }
            >
              <Icon size={19} />
              {title}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-purple-100 transition hover:bg-white/10"
        >
          <LogOut size={19} />
          Sign out
        </button>

        <div className="mt-3 rounded-xl border border-purple-400/20 p-3">
          <p className="text-[10px] font-bold tracking-widest text-purple-300">
            SIH 2026 PROTOTYPE
          </p>

          <p className="mt-1 text-sm font-bold">Team Nexus</p>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;