import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import ChallengeModal from "../components/ChallengeModal";
import api from "../services/api";

const dashboardPaths = {
  CITIZEN: "/citizen/dashboard",
  ADMIN: "/admin/dashboard",
  UNIVERSITY: "/university/dashboard",
};

const statusStyles = {
  "Under Review": "bg-amber-50 text-amber-800",
  Verified: "bg-blue-50 text-blue-700",
  "University Matched": "bg-purple-50 text-purple-700",
  "Pilot in Progress": "bg-orange-50 text-orange-700",
  "Awaiting Community Validation": "bg-cyan-50 text-cyan-800",
  Resolved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const processSteps = [
  {
    icon: FileText,
    title: "Report a challenge",
    description: "Describe the problem and add location or evidence.",
  },
  {
    icon: ShieldCheck,
    title: "Review the evidence",
    description: "Administrators review reports with AI-assisted suggestions.",
  },
  {
    icon: GraduationCap,
    title: "Build a solution",
    description: "University teams develop proposals, prototypes and pilots.",
  },
  {
    icon: CheckCircle2,
    title: "Validate the outcome",
    description: "The reporting citizen reviews the completed solution.",
  },
];

function formatNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-IN")
    : "—";
}

function EvidencePreview({ challenge }) {
  const [failed, setFailed] = useState(false);

  if (
    !failed &&
    challenge.evidenceUrl &&
    challenge.evidenceResourceType === "image"
  ) {
    return (
      <img
        src={challenge.evidenceUrl}
        alt={`Evidence for ${challenge.title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-105"
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-linear-to-br from-blue-50 via-slate-50 to-indigo-100 text-blue-600">
      <FileText size={34} strokeWidth={1.4} />
      <span className="text-xs font-semibold">
        {challenge.evidenceResourceType === "video"
          ? "Video evidence available in details"
          : failed
            ? "Image preview unavailable"
            : "Community report"}
      </span>
    </div>
  );
}

function Home() {
  const user = useSelector((state) => state.auth.user);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = dashboardPaths[user?.role];
  const accountPath = dashboardPath || "/auth";

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      setLoading(true);
      setError("");

      try {
        const [statsResponse, reportsResponse] = await Promise.all([
          api.get("/challenges/stats/summary", { timeout: 20000 }),
          api.get("/challenges", { timeout: 20000 }),
        ]);

        if (
          !statsResponse.data?.stats ||
          !Array.isArray(reportsResponse.data?.challenges)
        ) {
          throw new Error("Unexpected response format");
        }

        if (cancelled) return;

        setData({
          stats: statsResponse.data.stats,
          challenges: reportsResponse.data.challenges,
          refreshedAt: new Date(),
        });
      } catch (requestError) {
        if (cancelled) return;

        console.error("Home data loading failed:", requestError);
        setError("Unable to refresh community data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHome();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const reports = data?.challenges || [];
  const stats = data?.stats;

  const categories = [
    "All",
    ...Array.from(
      new Set(reports.map((report) => report.category).filter(Boolean))
    ).sort(),
  ];

  const searchText = search.trim().toLowerCase();

  const filteredReports = reports
    .filter((report) => {
      const matchesCategory =
        category === "All" || report.category === category;

      const matchesSearch = [
        report.title,
        report.description,
        report.location,
        report.trackingId,
      ].some((value) =>
        String(value || "").toLowerCase().includes(searchText)
      );

      return matchesCategory && matchesSearch;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const metrics = [
    {
      label: "Reports submitted",
      value: stats?.total,
      icon: FileText,
    },
    {
      label: "Currently under review",
      value: stats?.underReview,
      icon: Search,
    },
    {
      label: "Pilots in progress",
      value: stats?.inProgress,
      icon: GraduationCap,
    },
    {
      label: "Challenges resolved",
      value: stats?.resolved,
      icon: CheckCircle2,
    },
  ];

  const resolutionRate =
    typeof stats?.total === "number" &&
      typeof stats?.resolved === "number"
      ? stats.total > 0
        ? Math.min(100, Math.max(0, (stats.resolved / stats.total) * 100))
        : 0
      : null;

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setVisibleCount(6);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-slate-900">
      <style>{`
        @keyframes home-enter {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: no-preference) {
          .home-enter { animation: home-enter .65s ease-out both; }
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
              स
            </span>

            <div>
              <p className="font-extrabold tracking-tight">Samadhan Setu</p>
              <p className="text-[10px] font-bold tracking-[0.18em] text-blue-600">
                CITIZEN INNOVATION
              </p>
            </div>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex"
          >
            <a href="#challenges" className="hover:text-blue-600">
              Challenges
            </a>
            <a href="#process" className="hover:text-blue-600">
              How it works
            </a>
            <a href="#impact" className="hover:text-blue-600">
              Impact
            </a>
            <Link to="/university/register" className="hover:text-blue-600">
              For universities
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={accountPath}
              className="hidden rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600 sm:block"
            >
              {dashboardPath ? "My dashboard" : "Sign in"}
            </Link>

            <button
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((current) => !current)}
              className="rounded-xl border border-slate-200 p-2.5 lg:hidden"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="grid gap-1 border-t border-slate-100 px-5 py-4 text-sm font-semibold lg:hidden"
          >
            {[
              ["Challenges", "#challenges"],
              ["How it works", "#process"],
              ["Impact", "#impact"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 hover:bg-blue-50"
              >
                {label}
              </a>
            ))}

            <Link
              to="/university/register"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-3"
            >
              Join as a university
            </Link>

            <Link
              to={accountPath}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-blue-50 px-3 py-3 text-blue-700"
            >
              {dashboardPath ? "My dashboard" : "Sign in"}
            </Link>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 pb-10 pt-10 md:pt-16">
          <div className="home-enter relative overflow-hidden rounded-4xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-700 px-6 py-12 text-white md:p-12 lg:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full border-60 border-white/5"
            />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
              <div>
                <p className="inline-flex rounded-full border border-blue-300/25 bg-blue-300/10 px-4 py-2 text-xs font-bold tracking-widest text-blue-100">
                  YOUR COMMUNITY. YOUR VOICE.
                </p>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                  Local challenges.
                  <span className="block text-blue-300">
                    Shared solutions.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-blue-100/90">
                  Connect community problems with people who can help.
                  Report an issue, follow its progress and review the
                  solution built by university teams.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={
                      user?.role === "CITIZEN"
                        ? "/citizen/report"
                        : accountPath
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
                  >
                    {dashboardPath && user?.role !== "CITIZEN"
                      ? "Open my dashboard"
                      : "Report a challenge"}
                    <ArrowRight size={18} />
                  </Link>

                  <a
                    href="#challenges"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200/30 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Explore reports
                    <Search size={17} />
                  </a>
                </div>
              </div>

              <aside className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-widest text-blue-100">
                    COMMUNITY SNAPSHOT
                  </p>
                  <CheckCircle2 size={22} className="text-blue-200" />
                </div>

                <p className="mt-7 text-5xl font-black">
                  {resolutionRate === null
                    ? "—"
                    : `${resolutionRate.toFixed(1)}%`}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  of submitted challenges resolved
                </p>

                <div
                  role="progressbar"
                  aria-label="Challenge resolution rate"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={resolutionRate ?? undefined}
                  className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"
                >
                  <div
                    style={{ width: `${resolutionRate ?? 0}%` }}
                    className="h-full rounded-full bg-blue-300 transition-all duration-700 motion-reduce:transition-none"
                  />
                </div>

                <div className="mt-6 flex justify-between gap-4 border-t border-white/15 pt-5 text-sm">
                  <span className="text-blue-100">Resolved reports</span>
                  <span className="font-bold">
                    {formatNumber(stats?.resolved)} /{" "}
                    {formatNumber(stats?.total)}
                  </span>
                </div>

                <p className="mt-5 text-xs leading-5 text-blue-200">
                  Platform-wide figures from submitted reports.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="impact"
          className="mx-auto max-w-7xl scroll-mt-28 px-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500" aria-live="polite">
              {loading
                ? "Refreshing community data..."
                : data
                  ? `Last refreshed ${data.refreshedAt.toLocaleTimeString(
                    "en-IN",
                    { hour: "2-digit", minute: "2-digit" }
                  )}`
                  : "Community data unavailable"}
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={() => setRefreshKey((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "motion-safe:animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              {error} {data && "Previously loaded data is still displayed."}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Icon size={21} />
                </div>
                <p className="text-3xl font-black tracking-tight sm:text-4xl">
                  {formatNumber(value)}
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  {label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="challenges"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-blue-600">
            COMMUNITY REPORTS
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            See what is happening locally.
          </h2>
          <p className="mt-3 text-slate-500">
            Browse submitted challenges and follow their current status.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-4 text-slate-400"
              />
              <input
                aria-label="Search community reports"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(6);
                }}
                placeholder="Search by problem, location or tracking number..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              aria-label="Filter reports by category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setVisibleCount(6);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-blue-500 sm:max-w-64"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All categories" : item}
                </option>
              ))}
            </select>
          </div>

          {loading && !data ? (
            <div
              role="status"
              className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-500"
            >
              Loading community reports...
            </div>
          ) : !data ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Reports could not be loaded. Use Refresh to try again.
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Search size={30} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-bold">
                {reports.length === 0
                  ? "No community reports yet"
                  : "No matching reports"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {reports.length === 0
                  ? "Submitted challenges will appear here."
                  : "Try another search or category."}
              </p>
              {(search || category !== "All") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 font-bold text-blue-600"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm text-slate-500">
                {filteredReports.length} matching{" "}
                {filteredReports.length === 1 ? "report" : "reports"} ·
                Newest first
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.slice(0, visibleCount).map((challenge) => (
                  <article
                    key={challenge.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="h-44 overflow-hidden">
                      <EvidencePreview
                        key={challenge.evidenceUrl || challenge.id}
                        challenge={challenge}
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                          {challenge.category}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyles[challenge.status] ||
                            "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {challenge.status}
                        </span>
                      </div>

                      <p className="mt-5 text-[11px] font-bold tracking-wide text-slate-400">
                        {challenge.trackingId || challenge.id}
                      </p>

                      <h3 className="mt-2 wrap-break-word text-lg font-extrabold leading-6">
                        {challenge.title}
                      </h3>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {challenge.description}
                      </p>

                      <p className="mb-5 mt-4 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        <span className="wrap-break-word">
                          {challenge.location || "Location not provided"}
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedChallenge(challenge)}
                        className="mt-auto flex w-full items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                      >
                        View report
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {visibleCount < filteredReports.length && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((current) => current + 6)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold hover:border-blue-400 hover:text-blue-600"
                  >
                    Show more reports
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section
          id="process"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-16"
        >
          <div className="rounded-4xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-cyan-50 px-6 py-10 md:p-10">
            <p className="text-xs font-bold tracking-[0.2em] text-blue-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              A clear path from report to resolution.
            </h2>

            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map(({ icon: Icon, title, description }, index) => (
                <article
                  key={title}
                  className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon size={25} />
                    </span>

                    <span className="text-2xl font-black text-blue-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-blue-100 bg-blue-50 p-7 sm:flex-row sm:items-center md:p-10">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                FOR UNIVERSITY TEAMS
              </p>
              <h2 className="mt-3 text-2xl font-extrabold">
                Bring your research into the community.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Apply to join, share your expertise and collaborate on
                verified challenges after administrator approval.
              </p>
            </div>

            <Link
              to={
                user?.role === "UNIVERSITY"
                  ? "/university/dashboard"
                  : "/university/register"
              }
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              {user?.role === "UNIVERSITY"
                ? "University dashboard"
                : "Apply as a university"}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-sm text-slate-500 sm:flex-row">
          <p className="font-bold text-slate-800">Samadhan Setu</p>
          <p>Community challenges. Collaborative solutions.</p>
          <p>© {new Date().getFullYear()} Team Nexus</p>
        </div>
      </footer>

      <ChallengeModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
      />
    </div>
  );
}

export default Home;