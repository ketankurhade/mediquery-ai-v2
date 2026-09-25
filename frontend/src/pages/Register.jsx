import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, TextInput } from "../components/ui";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-mq-canvas px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="mq-brand mx-auto mb-7 w-fit transition-opacity duration-150 hover:opacity-80">
          <span className="mq-brand__mark" aria-hidden="true">MQ</span>
          <span>MediQuery</span>
        </Link>
        <Card className="p-6 sm:p-8">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-mq-ink">Create your account</h1>
            <p className="mb-0 mt-2 text-sm leading-6 text-mq-muted">Start exploring your medical reports with MediQuery.</p>
          </header>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div role="status" aria-live="polite" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800">
              Account created! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput id="register-name" label="Full Name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextInput id="register-email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextInput id="register-password" label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="mb-0 mt-6 text-center text-sm text-mq-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-mq-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mq-primary">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
