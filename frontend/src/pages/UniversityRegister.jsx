import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const expertiseFields = [
  {
    name: "departments",
    label: "Departments",
    placeholder: "Civil Engineering\nEnvironmental Engineering",
  },
  {
    name: "skills",
    label: "Skills",
    placeholder: "Water testing\nIoT sensors",
  },
  {
    name: "researchAreas",
    label: "Research areas",
    placeholder: "Water purification\nWaste management",
  },
];

export default function UniversityRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    departments: "",
    skills: "",
    researchAreas: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("University name and email are required.");
      return;
    }

    if (
      form.password.length < 8 ||
      new TextEncoder().encode(form.password).length > 72
    ) {
      setError(
        "Use a password of at least 8 characters and at most 72 UTF-8 bytes."
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    for (const field of expertiseFields) {
      const entries = form[field.name]
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (
        entries.length > 20 ||
        entries.some((entry) => entry.length > 100)
      ) {
        setError(
          `${field.label}: maximum 20 entries, each up to 100 characters.`
        );
        return;
      }

      payload[field.name] = entries;
    }

    try {
      setLoading(true);

      await api.post("/auth/register-university", payload);

      setForm((current) => ({ ...current, password: "" }));
      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit your application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-3xl border border-orange-100 bg-white p-6 shadow-xl md:p-10">
        <Link
          to="/auth"
          className="text-sm font-bold text-orange-700 hover:underline"
        >
          ← Back to login
        </Link>

        {submitted ? (
          <div className="py-10 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Application submitted
            </h1>

            <p role="status" className="mt-4 leading-7 text-slate-600">
              Your university application is awaiting admin approval.
              Once approved, log in using the email and password
              you registered with.
            </p>

            <Link
              to="/auth"
              className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-8 text-xs font-bold tracking-widest text-orange-600">
              UNIVERSITY PARTNERS
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Join Samadhan Setu
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Apply to participate in community innovation projects.
              An administrator will review your application.
            </p>

            <form onSubmit={handleSubmit} className="mt-7">
              <fieldset disabled={loading} className="space-y-5">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    University name
                  </span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    autoComplete="organization"
                    placeholder="Enter your university name"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    University contact email
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="Use your institutional email if available"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Password
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </label>

                {expertiseFields.map((field) => (
                  <label key={field.name} className="block">
                    <span className="text-sm font-bold text-slate-700">
                      {field.label}
                    </span>

                    <textarea
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      rows={3}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />

                    <span className="mt-1 block text-xs text-slate-500">
                      Optional. One entry per line; up to 20 entries,
                      each up to 100 characters.
                    </span>
                  </label>
                ))}

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit application"}
                </button>
              </fieldset>
            </form>
          </>
        )}
      </section>
    </main>
  );
}