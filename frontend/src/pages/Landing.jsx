import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui";

const features = [
  {
    marker: "PDF",
    title: "Upload a report",
    description: "Add a lab report as a PDF or image to get started.",
  },
  {
    marker: "01",
    title: "Review extracted results",
    description: "See patient details, test values, and the statuses shown for your report.",
  },
  {
    marker: "Q&A",
    title: "Ask about your report",
    description: "Chat about a report using Simple, Detailed, or Clinical explanation styles.",
  },
  {
    marker: "↗",
    title: "Follow test trends",
    description: "View a test’s values across reports when it appears in at least two reports.",
  },
  {
    marker: "↔",
    title: "Compare reports",
    description: "Compare matching test names from two of your reports.",
  },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mq-landing-ambient min-h-screen overflow-x-hidden bg-mq-canvas text-mq-ink">
      <header className="border-b border-mq-border bg-white">
        <nav className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main navigation">
          <Link to="/" className="mq-brand transition-opacity duration-150 hover:opacity-80">
            <span className="mq-brand__mark" aria-hidden="true">MQ</span>
            <span>MediQuery</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="mq-button mq-button--secondary mq-button--sm transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm">
              Log in
            </Link>
            <Link to="/register" className="mq-button mq-button--primary mq-button--sm transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20" aria-labelledby="landing-title">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-mq-border bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-mq-primary">
              <span className="h-2 w-2 rounded-full bg-mq-primary" aria-hidden="true" />
              MEDIQUERY AI · REPORT COMPANION
            </p>
            <h1 id="landing-title" className="max-w-2xl text-4xl font-bold leading-tight tracking-[-0.04em] text-mq-ink sm:text-5xl lg:text-[3.5rem]">
              A clearer way to explore your medical reports.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-mq-muted sm:text-lg">
              Upload a lab report, review its extracted results, and ask questions about the information it contains. MediQuery is made for people who want a simpler way to explore their reports.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="mq-button mq-button--primary mq-button--md w-full transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm sm:w-auto">
                Get started
              </Link>
              <Link to="/login" className="mq-button mq-button--secondary mq-button--md w-full transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm sm:w-auto">
                Log in to your account
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-mq-muted">
              For informational purposes. Not a substitute for professional medical advice.
            </p>
          </div>

          <Card className="relative mx-auto w-full max-w-xl overflow-hidden p-5 sm:p-7">
            <div className="flex items-start gap-4 border-b border-mq-border pb-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mq-primary/10 text-xs font-extrabold tracking-wide text-mq-primary" aria-hidden="true">
                MQ
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">
                  Report workspace
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-mq-ink sm:text-xl">
                  Your report, ready to explore
                </h2>
                <p className="mt-1 text-sm text-mq-muted">
                  A simple path from upload to follow-up questions.
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-3" aria-label="MediQuery report workflow">
              <li className="flex items-center gap-3 rounded-xl border border-mq-border bg-slate-50/70 p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-mq-primary shadow-sm" aria-hidden="true">1</span>
                <span>
                  <span className="block text-sm font-semibold text-mq-ink">Upload your report</span>
                  <span className="mt-0.5 block text-xs text-mq-muted">PDF or image</span>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-mq-border bg-slate-50/70 p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-mq-primary shadow-sm" aria-hidden="true">2</span>
                <span>
                  <span className="block text-sm font-semibold text-mq-ink">Review extracted results</span>
                  <span className="mt-0.5 block text-xs text-mq-muted">Values and reported statuses</span>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-mq-border bg-slate-50/70 p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-mq-primary shadow-sm" aria-hidden="true">3</span>
                <span>
                  <span className="block text-sm font-semibold text-mq-ink">Explore your report</span>
                  <span className="mt-0.5 block text-xs text-mq-muted">Chat, compare, and track tests</span>
                </span>
              </li>
            </ol>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-mq-border pt-4" aria-label="Supported report formats">
              {["PDF", "JPG", "JPEG", "PNG"].map((format) => (
                <span key={format} className="rounded-full border border-mq-border bg-white px-2.5 py-1 text-xs font-semibold text-mq-muted">
                  {format}
                </span>
              ))}
            </div>
          </Card>
        </section>

        <section className="border-y border-mq-border bg-[#EEF5F6]" aria-labelledby="features-heading">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="mb-7 max-w-2xl sm:mb-9">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">Explore your reports</p>
              <h2 id="features-heading" className="mt-2 text-2xl font-bold tracking-tight text-mq-ink sm:text-3xl">
                The tools to review and revisit your results
              </h2>
              <p className="mt-3 text-sm leading-6 text-mq-muted sm:text-base">
                Keep report details, questions, and past test values together in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card as="article" key={feature.title} className="h-full p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-mq-primary/30 hover:shadow-md sm:p-6">
                  <span className="grid h-10 min-w-10 w-fit place-items-center rounded-xl bg-mq-primary/10 px-2.5 text-xs font-bold text-mq-primary" aria-hidden="true">
                    {feature.marker}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-mq-ink">{feature.title}</h3>
                  <p className="mb-0 mt-2 text-sm leading-6 text-mq-muted">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="how-it-works-heading">
          <div className="mx-auto mb-7 max-w-xl text-center sm:mb-9">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">How it works</p>
            <h2 id="how-it-works-heading" className="mt-2 text-2xl font-bold tracking-tight text-mq-ink sm:text-3xl">
              Three steps to explore a report
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { number: "01", title: "Upload", description: "Choose a PDF or image of your medical report." },
              { number: "02", title: "Review", description: "See the extracted patient details and test results." },
              { number: "03", title: "Explore", description: "Chat about the report, compare reports, or follow test values over time." },
            ].map((step) => (
              <Card as="article" key={step.number} className="p-5 sm:p-6">
                <p className="text-xs font-bold tracking-[0.12em] text-mq-primary">STEP {step.number}</p>
                <h3 className="mt-2 text-lg font-bold text-mq-ink">{step.title}</h3>
                <p className="mb-0 mt-2 text-sm leading-6 text-mq-muted">{step.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-mq-border bg-white" aria-labelledby="disclaimer-heading">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-start sm:px-6">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-mq-muted" aria-hidden="true">i</span>
            <div>
              <h2 id="disclaimer-heading" className="text-sm font-bold text-mq-ink">An informational tool</h2>
              <p className="mb-0 mt-1 max-w-4xl text-sm leading-6 text-mq-muted">
                MediQuery is for informational purposes only and is not a substitute for professional medical advice. Please consult a qualified doctor for diagnosis and treatment.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="final-cta-heading">
          <Card className="flex flex-col items-start justify-between gap-6 border-mq-primary/15 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">Start with a report</p>
              <h2 id="final-cta-heading" className="mt-2 text-2xl font-bold tracking-tight text-mq-ink sm:text-3xl">
                Make more room to explore your results.
              </h2>
              <p className="mb-0 mt-2 text-sm leading-6 text-mq-muted">
                Upload a report to review its contents and continue with questions, comparisons, or trends.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-40">
              <Link to="/register" className="mq-button mq-button--primary mq-button--md w-full transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm">
                Get started
              </Link>
              <Link to="/login" className="mq-button mq-button--secondary mq-button--md w-full transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm">
                Log in
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-mq-border bg-white px-4 py-6 text-center text-sm text-mq-muted sm:px-6">
        © 2026 MediQuery · Made with ❤️
      </footer>
    </div>
  );
}
