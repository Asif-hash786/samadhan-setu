import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import UniversitySidebar from "../components/UniversitySidebar";
import NotificationBell from "../components/NotificationBell";
function UniversityLayout({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fff7ed]">
      <UniversitySidebar
        mobileOpen={mobileOpen}
        closeSidebar={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-24 items-center justify-between border-b border-orange-100 bg-white/85 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-700 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-orange-600">
                {subtitle}
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-slate-900 md:text-2xl">
                {title}
              </h2>
            </div>
          </div>

          <NotificationBell />
        </header>

        <main className="mx-auto max-w-7xl p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default UniversityLayout;