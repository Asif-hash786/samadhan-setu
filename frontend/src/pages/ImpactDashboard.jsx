import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { FileText, Clock3, CheckCircle2, RefreshCw } from "lucide-react";
import gsap from "gsap";
import CitizenLayout from "../layouts/CitizenLayout";
import AdminLayout from "../layouts/AdminLayout";
import UniversityLayout from "../layouts/UniversityLayout";
import api from "../services/api";

const layouts = {
  ADMIN: AdminLayout,
  UNIVERSITY: UniversityLayout,
  CITIZEN: CitizenLayout,
};

const colors = {
  "Water & Sanitation": "#2563eb",
  "Waste Management": "#10b981",
  "Road Safety": "#f59e0b",
  "Public Health": "#ef4444",
  Infrastructure: "#8b5cf6",
  Other: "#64748b",
};

const number = (value) => Number(value).toLocaleString("en-IN");

export default function ImpactDashboard() {
  const user = useSelector((state) => state.auth.user);
  const Layout = layouts[user?.role] || CitizenLayout;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const containerRef = useRef(null);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/challenges/stats/summary");
      setData(response.data.stats);
      setUpdatedAt(new Date());
      setActiveCategory(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to refresh statistics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!data || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      gsap.from(".impact-card", {
        y: 16,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        clearProps: "all",
      });
    }, containerRef);

    return () => context.revert();
  }, [data]);

  const categories = (data?.categories || [])
    .map((item) => ({
      name: item.name,
      count: Number(item.value),
      color: colors[item.name] || "#64748b",
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const categoryTotal = categories.reduce(
    (sum, item) => sum + item.count,
    0
  );

  let offset = 0;

  const segments = categories.map((item) => {
    const share = (item.count / categoryTotal) * 100;
    const segment = { ...item, share, offset };
    offset += share;
    return segment;
  });

  const selected = segments.find((item) => item.name === activeCategory);

  const statuses = data
    ? [
        { name: "Under review", count: data.underReview, color: "#f59e0b" },
        { name: "Currently verified", count: data.verified, color: "#2563eb" },
        { name: "University matched", count: data.matched, color: "#8b5cf6" },
        { name: "Pilot in progress", count: data.inProgress, color: "#06b6d4" },
        { name: "Resolved", count: data.resolved, color: "#10b981" },
      ]
    : [];

  const otherCount = data
    ? Math.max(
        0,
        data.total - statuses.reduce((sum, item) => sum + item.count, 0)
      )
    : 0;

  if (otherCount > 0) {
    statuses.push({
      name: "Other statuses",
      count: otherCount,
      color: "#94a3b8",
    });
  }

  const cards = data
    ? [
        { title: "Total reports", value: number(data.total), icon: FileText },
        { title: "Under review", value: number(data.underReview), icon: Clock3 },
        { title: "Resolved reports", value: number(data.resolved), icon: CheckCircle2 },
        {
          title: "Resolution rate",
          value: `${data.total ? ((data.resolved / data.total) * 100).toFixed(1) : "0"}%`,
          icon: CheckCircle2,
        },
      ]
    : [];

  return (
    <Layout title="Community impact" subtitle="PLATFORM OVERVIEW">
      <div ref={containerRef} className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-blue-950 to-blue-700 p-6 text-white md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-200">
                COMMUNITY PROGRESS
              </p>
              <h2 className="mt-2 text-2xl font-extrabold">
                Every report, accounted for
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                Platform-wide statistics across all citizens and universities.
              </p>
              {updatedAt && (
                <p className="mt-3 text-xs text-blue-200">
                  Last refreshed: {updatedAt.toLocaleTimeString("en-IN")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-blue-800 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
            {error} {data && "Previously loaded figures remain visible."}
          </p>
        )}

        {loading && !data && (
          <p role="status" className="rounded-xl bg-blue-50 p-6 text-blue-700">
            Loading statistics...
          </p>
        )}

        {data && (
          <>
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {cards.map(({ title, value, icon: Icon }) => (
                <article
                  key={title}
                  className="impact-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Icon size={22} className="text-blue-600" />
                  <p className="mt-5 text-3xl font-extrabold text-slate-900">
                    {value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{title}</p>
                </article>
              ))}
            </section>

            <section className="impact-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs font-bold tracking-widest text-blue-600">
                CATEGORY DISTRIBUTION
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                What communities are reporting
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Select a category to highlight its share of all reports.
              </p>

              {categoryTotal === 0 ? (
                <p className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-500">
                  No reports yet. Category distribution will appear here.
                </p>
              ) : (
                <div className="mt-8 grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="relative mx-auto w-full max-w-[300px]">
                    <svg
                      viewBox="0 0 240 240"
                      className="w-full -rotate-90"
                      role="img"
                      aria-label="Category shares. Exact counts are listed beside the chart."
                    >
                      {segments.map((item) => (
                        <circle
                          key={item.name}
                          cx="120"
                          cy="120"
                          r="92"
                          fill="none"
                          stroke={item.color}
                          strokeWidth={activeCategory === item.name ? 30 : 24}
                          pathLength="100"
                          strokeDasharray={`${item.share} ${100 - item.share}`}
                          strokeDashoffset={-item.offset}
                          opacity={!activeCategory || activeCategory === item.name ? 1 : 0.22}
                          className="transition-all motion-reduce:transition-none"
                        >
                          <title>
                            {item.name}: {item.count} reports
                          </title>
                        </circle>
                      ))}
                    </svg>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
                      <strong className="text-4xl font-extrabold text-slate-900">
                        {number(selected?.count ?? categoryTotal)}
                      </strong>
                      <span className="mt-2 text-sm text-slate-500">
                        {selected?.name || "Total reports"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {segments.map((item) => (
                      <button
                        type="button"
                        key={item.name}
                        aria-pressed={activeCategory === item.name}
                        onClick={() =>
                          setActiveCategory((current) =>
                            current === item.name ? null : item.name
                          )
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          activeCategory === item.name
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-100 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="flex-1 text-sm font-semibold text-slate-800">
                            {item.name}
                          </span>
                          <span className="text-right text-sm font-bold text-slate-900">
                            {number(item.count)}
                            <span className="ml-2 font-normal text-slate-500">
                              {item.share.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.share}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="impact-card rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
              <h2 className="text-xl font-extrabold text-slate-900">
                Where reports stand today
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Current status counts, not a historical completion trend.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statuses.map((item) => (
                  <div key={item.name} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">{item.name}</p>
                    <p
                      className="mt-2 text-2xl font-extrabold"
                      style={{ color: item.color }}
                    >
                      {number(item.count)}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs leading-6 text-slate-500">
                Other statuses include submitted, rejected, and awaiting
                community validation. Historical resolution times, financial
                savings, and environmental outcomes are not measured here.
              </p>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}