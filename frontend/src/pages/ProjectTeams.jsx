import {
  CheckCircle2,
  GraduationCap,
  Save,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import UniversityLayout from "../layouts/UniversityLayout";
import api from "../services/api";

function ProjectTeams() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] =
    useState(null);

  const [form, setForm] = useState({
    teamName: "",
    facultyMentor: "",
    studentCount: 1,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

        const acceptedProjects = (
          response.data.assignments || []
        ).filter((assignment) =>
          ["ACCEPTED", "COMPLETED"].includes(
            assignment.status
          )
        );

        setProjects(acceptedProjects);
      } catch (requestError) {
        console.error(
          "Project team loading failed:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            "Unable to load project teams."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const statistics = useMemo(() => {
    const configuredTeams = projects.filter(
      (project) => project.teamName
    );

    const studentTotal = projects.reduce(
      (total, project) =>
        total + (project.studentCount || 0),
      0
    );

    const mentorTotal = new Set(
      projects
        .map((project) => project.facultyMentor)
        .filter(Boolean)
    ).size;

    return {
      projects: projects.length,
      teams: configuredTeams.length,
      students: studentTotal,
      mentors: mentorTotal,
    };
  }, [projects]);

  function openTeamForm(project) {
    setSelectedProject(project);

    setForm({
      teamName: project.teamName || "",
      facultyMentor: project.facultyMentor || "",
      studentCount: project.studentCount || 1,
    });

    setError("");
    setMessage("");
  }

  function closeTeamForm() {
    if (saving) return;

    setSelectedProject(null);
    setError("");
  }

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function saveTeam(event) {
    event.preventDefault();

    if (!selectedProject) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await api.patch(
        `/universities/assignments/${selectedProject.id}/team`,
        {
          teamName: form.teamName.trim(),
          facultyMentor: form.facultyMentor.trim(),
          studentCount: Number(form.studentCount),
        }
      );

      const updatedProject = response.data.assignment;

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === updatedProject.id
            ? updatedProject
            : project
        )
      );

      setMessage(response.data.message);
      setSelectedProject(null);
    } catch (requestError) {
      console.error("Project team save failed:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to save the project team."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <UniversityLayout
      title="Project teams"
      subtitle="TEAM MANAGEMENT"
    >
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-700 to-orange-500 p-7 text-white shadow-xl shadow-orange-200 md:p-9">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-orange-200">
            FACULTY-GUIDED INNOVATION
          </p>

          <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
            Build student teams for community projects
          </h2>

          <p className="mt-3 leading-7 text-orange-100">
            Assign a team name, faculty mentor and student
            strength to every accepted challenge.
          </p>
        </div>

        <div className="absolute -right-20 -top-24 size-72 rounded-full border-[48px] border-white/5" />
      </section>

      {message && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}

      {error && !selectedProject && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          [statistics.projects, "Accepted projects"],
          [statistics.teams, "Teams created"],
          [statistics.students, "Students involved"],
          [statistics.mentors, "Faculty mentors"],
        ].map(([value, label]) => (
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
          Loading project teams...
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Users
            size={38}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            No accepted projects
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Accept a challenge invitation before creating its
            project team.
          </p>
        </div>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const teamConfigured = Boolean(
            project.teamName &&
              project.facultyMentor &&
              project.studentCount
          );

          return (
            <article
              key={project.id}
              className="flex flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                  {project.challenge.trackingId}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    teamConfigured
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {teamConfigured
                    ? "TEAM READY"
                    : "SETUP REQUIRED"}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-extrabold leading-6 text-slate-900">
                {project.challenge.title}
              </h2>

              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                {project.challenge.category} •{" "}
                {project.challenge.location}
              </p>

              <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <Users
                    size={17}
                    className="text-orange-600"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Project team
                    </p>

                    <p className="font-bold text-slate-900">
                      {project.teamName || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap
                    size={17}
                    className="text-orange-600"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Faculty mentor
                    </p>

                    <p className="font-bold text-slate-900">
                      {project.facultyMentor || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users
                    size={17}
                    className="text-orange-600"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Student strength
                    </p>

                    <p className="font-bold text-slate-900">
                      {project.studentCount || 0} students
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openTeamForm(project)}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
              >
                <Save size={17} />

                {teamConfigured
                  ? "Edit team"
                  : "Create team"}
              </button>
            </article>
          );
        })}
      </section>

      {selectedProject && (
        <div
          onClick={closeTeamForm}
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={saveTeam}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-orange-600">
                  PROJECT TEAM
                </p>

                <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                  {selectedProject.challenge.title}
                </h2>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeTeamForm}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-700">
                Team name
              </span>

              <input
                type="text"
                name="teamName"
                required
                value={form.teamName}
                onChange={handleChange}
                placeholder="Example: Aqua Innovation Team"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                Faculty mentor
              </span>

              <input
                type="text"
                name="facultyMentor"
                required
                value={form.facultyMentor}
                onChange={handleChange}
                placeholder="Example: Dr. Priya Sharma"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                Number of students
              </span>

              <input
                type="number"
                name="studentCount"
                required
                min="1"
                max="50"
                value={form.studentCount}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            {error && (
              <p className="mt-4 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                disabled={saving}
                onClick={closeTeamForm}
                className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Save size={17} />

                {saving ? "Saving team..." : "Save team"}
              </button>
            </div>
          </form>
        </div>
      )}
    </UniversityLayout>
  );
}

export default ProjectTeams;