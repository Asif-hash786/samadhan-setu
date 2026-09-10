import {
  CheckCircle2,
  Circle,
  Clock3,
  Edit3,
  MapPin,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import UniversityLayout from "../layouts/UniversityLayout";
import api from "../services/api";

const milestoneNames = [
  "Problem research",
  "Solution design",
  "Prototype development",
  "Community pilot",
  "Impact validation",
];

function ActiveProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] =
    useState(null);
  const [updateNote, setUpdateNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/universities/projects/mine"
        );

        const activeProjects = (
          response.data.assignments || []
        ).filter((assignment) =>
          ["ACCEPTED", "COMPLETED"].includes(
            assignment.status
          )
        );

        setProjects(activeProjects);
      } catch (requestError) {
        console.error("Project loading failed:", requestError);

        setError(
          requestError.response?.data?.message ||
            "Unable to load active projects."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const statistics = useMemo(
    () => [
      {
        value: projects.length,
        label: "Total projects",
      },
      {
        value: projects.filter(
          (project) => project.status === "ACCEPTED"
        ).length,
        label: "Active projects",
      },
      {
        value: projects.filter(
          (project) =>
            project.challenge.status === "Pilot in Progress"
        ).length,
        label: "Pilots in progress",
      },
      {
        value: projects.filter(
          (project) => project.status === "COMPLETED"
        ).length,
        label: "Completed",
      },
    ],
    [projects]
  );

  function getMilestones(project) {
    return milestoneNames.map((title, index) => {
      const milestoneNumber = index + 1;
      const milestoneProgress = milestoneNumber * 20;

      let status = "pending";

      if (project.progress >= milestoneProgress) {
        status = "completed";
      } else if (
        project.status !== "COMPLETED" &&
        milestoneNumber === project.currentMilestone
      ) {
        status = "current";
      }

      return {
        title,
        status,
      };
    });
  }

  function openMilestone(project) {
    setSelectedProject(project);
    setUpdateNote("");
    setError("");
    setMessage("");
  }

  async function completeCurrentMilestone() {
    if (!selectedProject) return;

    if (updateNote.trim().length < 10) {
      setError(
        "Please enter a progress update containing at least 10 characters."
      );
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await api.patch(
        `/universities/assignments/${selectedProject.id}/progress`,
        {
          updateNote: updateNote.trim(),
        }
      );

      const updatedProject = response.data.assignment;

      setProjects((current) =>
        current.map((project) =>
          project.id === updatedProject.id
            ? updatedProject
            : project
        )
      );

      setMessage(response.data.message);
      setSelectedProject(null);
      setUpdateNote("");
    } catch (requestError) {
      console.error("Milestone update failed:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to update the milestone."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <UniversityLayout
      title="Active projects"
      subtitle="PROJECT WORKSPACE"
    >
      {message && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}

      {error && !selectedProject && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statistics.map(({ value, label }) => (
          <article
            key={label}
            className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
          >
            <strong className="text-2xl font-extrabold text-slate-900 md:text-3xl">
              {value}
            </strong>

            <p className="mt-1 text-sm text-slate-500">
              {label}
            </p>
          </article>
        ))}
      </section>

      {loading && (
        <div className="mt-6 rounded-2xl bg-orange-50 p-5 text-center font-semibold text-orange-700">
          Loading active projects...
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Clock3
            size={36}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            No active projects yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Accept an invitation from the university dashboard
            to create a project.
          </p>
        </div>
      )}

      <section className="mt-6 space-y-5">
        {projects.map((project) => {
          const challenge = project.challenge;
          const milestones = getMilestones(project);

          return (
            <article
              key={project.id}
              className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm md:p-7"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                      PROJECT
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {challenge.trackingId}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        project.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-extrabold text-slate-900 md:text-2xl">
                    {challenge.title}
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                    {challenge.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                      <MapPin size={16} />
                      {challenge.location}
                    </span>

                    <span>
                      Category:{" "}
                      <strong>{challenge.category}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={project.status === "COMPLETED"}
                  onClick={() => openMilestone(project)}
                                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-700"
                >
                  {project.status === "COMPLETED" ? (
                    <>
                      <CheckCircle2 size={17} />
                      Project completed
                    </>
                  ) : (
                    <>
                      <Edit3 size={17} />
                      Update milestone
                    </>
                  )}
                </button>
              </div>

              <div className="mt-7">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-slate-500">
                    Overall progress
                  </span>

                  <span className="font-extrabold text-orange-600">
                    {project.progress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-orange-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-0 md:grid-cols-5">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.title}
                    className="relative flex gap-3 pb-6 md:block md:pb-0 md:text-center"
                  >
                    {index !== milestones.length - 1 && (
                      <>
                        <span className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-200 md:left-1/2 md:top-[13px] md:h-0.5 md:w-full" />

                        {milestone.status === "completed" && (
                          <span className="absolute left-[13px] top-7 h-full w-0.5 bg-emerald-400 md:left-1/2 md:top-[13px] md:h-0.5 md:w-full" />
                        )}
                      </>
                    )}

                    <div
                      className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full md:mx-auto ${
                        milestone.status === "completed"
                          ? "bg-emerald-500 text-white"
                          : milestone.status === "current"
                            ? "bg-orange-500 text-white ring-4 ring-orange-100"
                            : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {milestone.status === "completed" ? (
                        <CheckCircle2 size={16} />
                      ) : milestone.status === "current" ? (
                        <Clock3 size={15} />
                      ) : (
                        <Circle size={12} />
                      )}
                    </div>

                    <div className="md:mt-4">
                      <p className="text-sm font-bold text-slate-800">
                        {milestone.title}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {milestone.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {project.proposal && (
                <div className="mt-7 rounded-xl bg-slate-50 p-4 text-sm leading-6">
                  <span className="text-slate-500">
                    Approved proposal:{" "}
                  </span>

                  <strong className="text-slate-900">
                    {project.proposal}
                  </strong>
                </div>
              )}

              {project.lastUpdate && (
                <div className="mt-3 rounded-xl bg-orange-50 p-4 text-sm leading-6">
                  <span className="text-orange-700">
                    Latest progress update:{" "}
                  </span>

                  <strong className="text-slate-900">
                    {project.lastUpdate}
                  </strong>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {selectedProject && (
        <div
          onClick={() => !updating && setSelectedProject(null)}
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <article
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-orange-600">
                  MILESTONE UPDATE
                </p>

                <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                  {selectedProject.challenge.title}
                </h2>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => setSelectedProject(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-orange-50 p-5">
              <p className="text-xs font-bold text-orange-600">
                CURRENT MILESTONE
              </p>

              <p className="mt-2 font-extrabold text-slate-900">
                {
                  milestoneNames[
                    selectedProject.currentMilestone - 1
                  ]
                }
              </p>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-700">
                Progress update
              </span>

              <textarea
                value={updateNote}
                onChange={(event) =>
                  setUpdateNote(event.target.value)
                }
                rows="5"
                placeholder="Describe completed work, testing results or community feedback..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                disabled={updating}
                onClick={() => setSelectedProject(null)}
                className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={completeCurrentMilestone}
                className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {updating
                  ? "Saving progress..."
                  : "Complete current milestone"}
              </button>
            </div>
          </article>
        </div>
      )}
    </UniversityLayout>
  );
}

export default ActiveProjects;