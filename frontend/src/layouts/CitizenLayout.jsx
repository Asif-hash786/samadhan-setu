import { Bell, Menu, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CitizenSidebar from "../components/CitizenSidebar";
import NotificationBell from "../components/NotificationBell";
function CitizenLayout({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#eef4fc]">
      <CitizenSidebar
        mobileOpen={mobileOpen}
        closeSidebar={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-24 items-center justify-between gap-4 border-b border-blue-100 bg-white/85 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600">
                {subtitle}
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-slate-900 md:text-2xl">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"
            >
              <NotificationBell />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
            </button>

            <button
              onClick={() => navigate("/citizen/report")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
            >
              <Plus size={17} />

              <span className="hidden sm:inline">
                Report Challenge
              </span>

              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default CitizenLayout;