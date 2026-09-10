import {
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";
import CitizenLayout from "../layouts/CitizenLayout";
import api from "../services/api";

const categories = [
  "All",
  "Water & Sanitation",
  "Waste Management",
  "Road Safety",
  "Public Health",
  "Infrastructure",
  "Other",
];

function ExploreChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedChallenge, setSelectedChallenge] =
    useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/challenges");

      setChallenges(response.data.challenges);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load challenges. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchesCategory =
        selectedCategory === "All" ||
        challenge.category === selectedCategory;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        challenge.title.toLowerCase().includes(searchValue) ||
        challenge.location.toLowerCase().includes(searchValue) ||
        challenge.id.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [challenges, selectedCategory, search]);

  return (
    <CitizenLayout
      title="Explore community challenges"
      subtitle="PUBLIC CHALLENGES"
    >
      <section className="glass-card rounded-2xl p-5">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-3.5 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by challenge, location or tracking ID..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(category)
              }
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {loading
            ? "Loading challenges..."
            : `${filteredChallenges.length} challenges found`}
        </p>

        <button
          onClick={fetchChallenges}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-600 shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {loading && (
        <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <article
              key={item}
              className="glass-card animate-pulse rounded-2xl p-5"
            >
              <div className="h-7 w-28 rounded-full bg-slate-200" />
              <div className="mt-5 h-6 rounded bg-slate-200" />
              <div className="mt-3 h-4 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
              <div className="mt-8 h-11 rounded-xl bg-slate-200" />
            </article>
          ))}
        </section>
      )}

      {!loading && error && (
        <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            size={38}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-lg font-bold text-red-800">
            Could not load challenges
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={fetchChallenges}
            className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
          >
            Try again
          </button>
        </section>
      )}

      {!loading &&
        !error &&
        filteredChallenges.length > 0 && (
          <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onView={setSelectedChallenge}
              />
            ))}
          </section>
        )}

      {!loading &&
        !error &&
        filteredChallenges.length === 0 && (
          <section className="glass-card mt-5 rounded-2xl p-12 text-center">
            <Search
              size={40}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-bold text-slate-800">
              No challenges found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try another category or search term.
            </p>
          </section>
        )}

      <ChallengeModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
      />
    </CitizenLayout>
  );
}

export default ExploreChallenges;