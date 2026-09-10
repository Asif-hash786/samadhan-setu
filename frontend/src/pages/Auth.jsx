import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthError,
  loginUser,
  registerUser,
} from "../store/slices/authSlice";

function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    dispatch(clearAuthError());

    setForm({
      name: "",
      email: "",
      password: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      let user;

      if (mode === "register") {
        user = await dispatch(registerUser(form)).unwrap();
      } else {
        user = await dispatch(
          loginUser({
            email: form.email,
            password: form.password,
          })
        ).unwrap();
      }

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "UNIVERSITY") {
        navigate("/university/dashboard");
      } else {
        navigate("/citizen/dashboard");
      }
    } catch (submitError) {
      console.error("Authentication failed:", submitError);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-cyan-300/10" />

          <div className="relative">
            <div className="grid size-14 place-items-center rounded-2xl bg-white text-2xl font-black text-blue-700">
              स
            </div>

            <p className="mt-5 text-sm font-bold tracking-[0.25em] text-blue-100">
              SAMADHAN SETU
            </p>
          </div>

          <div className="relative">
            <h1 className="max-w-lg text-4xl font-black leading-tight xl:text-5xl">
              Turning citizen challenges into practical solutions.
            </h1>

            <p className="mt-5 max-w-md leading-7 text-blue-100">
              Report local problems, follow their verification and track
              university-led innovation projects.
            </p>
          </div>

          <p className="relative text-sm text-blue-100">
            Citizen innovation platform
          </p>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="mb-9 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>

            <p className="text-xs font-bold tracking-[0.22em] text-blue-600">
              WELCOME TO SAMADHAN SETU
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              {mode === "login"
                ? "Sign in to continue"
                : "Create citizen account"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {mode === "login"
                ? "Access your reports and track their progress."
                : "Join the community and submit local challenges."}
            </p>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${mode === "login"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500"
                  }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => changeMode("register")}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${mode === "register"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500"
                  }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {mode === "register" && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Full name
                  </span>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <User size={18} className="text-slate-400" />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                      className="w-full bg-transparent py-3.5 outline-none"
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Email address
                </span>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                  <Mail size={18} className="text-slate-400" />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-transparent py-3.5 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Password
                </span>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                  <Lock size={18} className="text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                    className="w-full bg-transparent py-3.5 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-slate-400 hover:text-blue-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
              Represent a university?{" "}
              <Link
                to="/university/register"
                className="font-bold text-orange-600 hover:underline"
              >
                Apply as a university
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Auth;