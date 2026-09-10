import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";
import api from "../services/api";

const statuses = [
  "All",
  "Under Review",
  "Verified",
  "Rejected",
  "University Matched",
  "Pilot in Progress",
  "Resolved",
];

function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChallenges() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/challenges");
        setChallenges(response.data.challenges || []);
      } catch (requestError) {
        console.error("Challenge loading failed:", requestError);
        setError("Unable to load challenges.");
      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return challenges.filter((challenge) => {
      const matchesStatus =
        status === "All" || challenge.status === status;

      const matchesSearch =
        !normalizedSearch ||
        challenge.title?.toLowerCase().includes(normalizedSearch) ||
        challenge.category?.toLowerCase().includes(normalizedSearch) ||
        challenge.location?.toLowerCase().includes(normalizedSearch) ||
        challenge.trackingId
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [challenges, search, status]);

  return (
    <AdminLayout
      title="All challenges"
      subtitle="CHALLENGE MANAGEMENT"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-purple-500">
            <Search size={18} className="text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, category, location or ID"
              className="w-full bg-transparent py-3 outline-none"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
            <SlidersHorizontal
              size={18}
              className="text-slate-400"
            />

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="min-w-48 bg-transparent py-3 outline-none"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing{" "}
            <strong className="text-slate-900">
              {filteredChallenges.length}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-900">
              {challenges.length}
            </strong>{" "}
            challenges
          </p>

          {(search || status !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("All");
              }}
              className="font-bold text-purple-600"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {loading && (
        <div className="mt-6 rounded-2xl bg-purple-50 p-5 text-center font-semibold text-purple-700">
          Loading challenges...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-center font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredChallenges.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No challenges match the selected filters.
        </div>
      )}

      {!loading && !error && (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onView={setSelectedChallenge}
            />
          ))}
        </section>
      )}

      <ChallengeModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
      />
    </AdminLayout>
  );
}

export default AdminChallenges;