import {
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

function UniversityMatching() {
  const [challenges, setChallenges] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedChallenge, setSelectedChallenge] =
    useState(null);
  const [selectedUniversities, setSelectedUniversities] =
    useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatchingData() {
      try {
        setLoading(true);
        setError("");

        const [challengeResponse, universityResponse] =
          await Promise.all([
            api.get("/challenges"),
            api.get("/universities"),
          ]);

        const eligibleChallenges = (
          challengeResponse.data.challenges || []
        ).filter((challenge) =>
          ["Verified", "University Matched"].includes(
            challenge.status
          )
        );

        const universityList =
          universityResponse.data.universities || [];

        setChallenges(eligibleChallenges);
        setUniversities(universityList);
        setSelectedChallenge(eligibleChallenges[0] || null);
      } catch (requestError) {
        console.error("Matching data loading failed:", requestError);

        setError(
          requestError.response?.data?.message ||
            "Unable to load matching information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMatchingData();
  }, []);

  const filteredUniversities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return universities.filter(
      (university) =>
        !query ||
        university.name.toLowerCase().includes(query) ||
        university.email.toLowerCase().includes(query)
    );
  }, [universities, search]);

  function selectChallenge(challenge) {
    setSelectedChallenge(challenge);
    setSelectedUniversities([]);
    setMessage("");
    setError("");
  }

  function toggleUniversity(universityId) {
    setSelectedUniversities((current) =>
      current.includes(universityId)
        ? current.filter((id) => id !== universityId)
        : [...current, universityId]
    );

    setMessage("");
    setError("");
  }

  async function assignSelectedUniversities() {
    if (!selectedChallenge) {
      setError("Select a challenge first.");
      return;
    }

    if (selectedUniversities.length === 0) {
      setError("Select at least one university.");
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setMessage("");

      const response = await api.post(
        `/challenges/${selectedChallenge.id}/assign-universities`,
        {
          universityIds: selectedUniversities,
        }
      );

      setMessage(response.data.message);
      setSelectedUniversities([]);

      setChallenges((current) =>
        current.map((challenge) =>
          challenge.id === selectedChallenge.id
            ? {
                ...challenge,
                status: "University Matched",
                progress: 60,
              }
            : challenge
        )
      );

      setSelectedChallenge((current) => ({
        ...current,
        status: "University Matched",
        progress: 60,
      }));
    } catch (requestError) {
      console.error("University assignment failed:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to assign universities."
      );
    } finally {
      setAssigning(false);
    }
  }

  return (
    <AdminLayout
      title="University matching"
      subtitle="AI-ASSISTED RECOMMENDATIONS"
    >
      {loading && (
        <div className="rounded-2xl bg-purple-50 p-5 text-center font-semibold text-purple-700">
          Loading matching information...
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}

      {!loading && (
        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.5fr]">
          <aside className="h-fit rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-purple-600">
              ELIGIBLE CHALLENGES
            </p>

            <h2 className="mt-2 text-xl font-extrabold text-slate-900">
              Select a challenge
            </h2>

            {challenges.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No verified challenges are currently available.
                Verify a challenge from the admin dashboard first.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {challenges.map((challenge) => (
                  <button
                    type="button"
                    key={challenge.id}
                    onClick={() => selectChallenge(challenge)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedChallenge?.id === challenge.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-purple-600">
                        {challenge.trackingId}
                      </span>

                      {selectedChallenge?.id === challenge.id && (
                        <CheckCircle2
                          size={17}
                          className="text-purple-600"
                        />
                      )}
                    </div>

                    <h3 className="mt-2 font-bold leading-6 text-slate-900">
                      {challenge.title}
                    </h3>

                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={13} />
                      {challenge.location}
                    </p>

                    <span className="mt-3 inline-block rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-purple-700">
                      {challenge.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div>
            {selectedChallenge ? (
              <>
                <section className="rounded-2xl bg-gradient-to-r from-purple-800 to-purple-600 p-6 text-white shadow-xl shadow-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15">
                      <Sparkles size={23} />
                    </div>

                    <div>
                      <p className="text-xs font-bold tracking-widest text-purple-200">
                        MATCHING FOR{" "}
                        {selectedChallenge.trackingId}
                      </p>

                      <h2 className="mt-2 text-xl font-extrabold md:text-2xl">
                        {selectedChallenge.title}
                      </h2>

                      <p className="mt-2 text-sm text-purple-100">
                        {selectedChallenge.category} •{" "}
                        {selectedChallenge.location}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-xs font-bold tracking-widest text-purple-600">
                        UNIVERSITY PARTNERS
                      </p>

                      <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                        Select multiple universities
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedUniversities.length} selected
                      </p>
                    </div>

                    <div className="relative w-full md:max-w-xs">
                      <Search
                        size={18}
                        className="absolute left-4 top-3.5 text-slate-400"
                      />

                      <input
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search universities..."
                        className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {filteredUniversities.map((university) => {
                      const selected =
                        selectedUniversities.includes(
                          university.id
                        );

                      return (
                        <button
                          type="button"
                          key={university.id}
                          onClick={() =>
                            toggleUniversity(university.id)
                          }
                          className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                            selected
                              ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                              : "border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700">
                            <Building2 size={22} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-slate-900">
                              {university.name}
                            </h3>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {university.email}
                            </p>

                            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-purple-600">
                              <Users size={14} />
                              {university._count
                                ?.challengeAssignments || 0}{" "}
                              existing assignments
                            </p>
                          </div>

                          <div
                            className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${
                              selected
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {selected && (
                              <CheckCircle2 size={17} />
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredUniversities.length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                        No university accounts found.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      assigning ||
                      selectedUniversities.length === 0
                    }
                    onClick={assignSelectedUniversities}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={18} />

                    {assigning
                      ? "Sending invitations..."
                      : `Invite ${selectedUniversities.length} selected universities`}
                  </button>
                </section>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                Select or verify a challenge to begin university
                matching.
              </div>
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

export default UniversityMatching;